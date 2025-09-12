import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireClerkAdmin, requireClerkSuperAdmin } from "~/lib/auth-clerk.server";
import { ProspectModel } from "~/models/Prospect.server";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { AdminAppointmentsBoard } from "~/components/appointments/AdminAppointmentsBoard";
import { generateICalFile, type AppointmentData } from "~/lib/calendar.server";
import { getClerkClient } from "~/lib/clerk.server";

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkAdmin(args);
  
  try {
    const clerkClient = getClerkClient();
    
    // Get all Clerk users (admins and superadmins who can be assigned to prospects)
    const allUsersResponse = await clerkClient.users.getUserList({ limit: 500 });
    const allClerkUsers = allUsersResponse.data;
    
    // Filter users who are admins or superadmins (these are our vendedores)
    const vendedores = allClerkUsers
      .filter(clerkUser => {
        const role = clerkUser.publicMetadata?.role as string;
        return role === 'admin' || role === 'superadmin';
      })
      .map(clerkUser => ({
        id: clerkUser.id,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Usuario',
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        avatar: clerkUser.imageUrl
      }));

    // Create a map for quick vendedor lookup
    const vendedorMap = new Map(vendedores.map(vendedor => [vendedor.id, vendedor]));
    
    // Get all prospects with appointments
    const prospectsWithAppointments = await ProspectModel.findAll({});
    
    // Filter prospects that have appointments and transform to appointment format
    const appointments = prospectsWithAppointments
      .filter(prospect => prospect.appointmentDate && prospect.status === 'appointment_scheduled')
      .map(prospect => {
        // Determine the vendedor - use currentlyAssignedTo, then createdBy, then assignedTo as fallback
        let vendedorId = prospect.currentlyAssignedTo || prospect.createdBy || prospect.assignedTo?.toString();
        
        // If no vendedor assigned, assign the first available vendedor
        if (!vendedorId || !vendedorMap.has(vendedorId)) {
          vendedorId = vendedores[0]?.id;
        }
        
        const vendedor = vendedorMap.get(vendedorId) || vendedores[0];
        
        return {
          id: prospect._id?.toString() || '',
          prospectId: prospect._id?.toString() || '',
          customerName: prospect.name,
          customerPhone: prospect.phone,
          sellerName: vendedor?.name || 'Sin Asignar',
          sellerEmail: vendedor?.email || 'sin-asignar@cliquealo.mx',
          sellerAvatar: vendedor?.avatar,
          appointmentDate: prospect.appointmentDate!.toISOString(),
          appointmentNotes: prospect.appointmentNotes,
          appointmentType: 'consultation' as const, // Default type, could be extended in prospect model
          duration: 60, // Default duration
          location: 'Cliquealo.mx - Oficinas',
          status: 'scheduled' as const,
          createdAt: prospect.createdAt.toISOString(),
          updatedAt: prospect.updatedAt.toISOString()
        };
      });

    return json({ 
      appointments, 
      sellers: vendedores,
      userPermissions: {
        isSuperAdmin: user.role === 'superadmin',
        isAdmin: user.role === 'admin' || user.role === 'superadmin'
      }
    });
    
  } catch (error) {
    console.error('Error loading appointments data:', error);
    
    // Fallback in case of Clerk API issues
    return json({ 
      appointments: [],
      sellers: [],
      userPermissions: { isSuperAdmin: false, isAdmin: false },
      error: 'Error loading appointment data. Please try again later.'
    });
  }
}

export async function action(args: ActionFunctionArgs) {
  await requireClerkAdmin(args);
  const { request } = args;
  
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  switch (action) {
    case "download_ical":
      const appointmentId = formData.get("appointmentId") as string;
      
      try {
        // Get appointment data
        const prospect = await ProspectModel.findById(appointmentId);
        if (!prospect || !prospect.appointmentDate) {
          return json({ error: "Appointment not found" }, { status: 404 });
        }

        // Get Clerk user data for the vendedor
        const clerkClient = getClerkClient();
        let sellerName = 'Vendedor Asignado';
        let sellerEmail = 'vendedor@cliquealo.mx';
        
        // Try to get vendedor info from currentlyAssignedTo, then createdBy or assignedTo
        const vendedorId = prospect.currentlyAssignedTo || prospect.createdBy || prospect.assignedTo?.toString();
        if (vendedorId) {
          try {
            const vendedor = await clerkClient.users.getUser(vendedorId);
            sellerName = `${vendedor.firstName || ''} ${vendedor.lastName || ''}`.trim() || 'Vendedor';
            sellerEmail = vendedor.emailAddresses[0]?.emailAddress || sellerEmail;
          } catch (vendedorError) {
            console.warn('Could not fetch vendedor info:', vendedorError);
          }
        }

        // Create appointment data for iCal
        const appointmentData: AppointmentData = {
          id: prospect._id!.toString(),
          title: `Cita - ${prospect.name}`,
          description: prospect.appointmentNotes,
          start: prospect.appointmentDate,
          end: new Date(prospect.appointmentDate.getTime() + 60 * 60000), // 1 hour default
          location: 'Cliquealo.mx - Oficinas',
          customerName: prospect.name,
          sellerName: sellerName,
          sellerEmail: sellerEmail,
          customerPhone: prospect.phone,
          appointmentType: 'consultation'
        };

        // Generate iCal content
        const icalContent = generateICalFile(appointmentData);

        // Return iCal file
        return new Response(icalContent, {
          headers: {
            'Content-Type': 'text/calendar',
            'Content-Disposition': `attachment; filename="cita-${prospect.name.replace(/\s+/g, '-')}.ics"`
          }
        });
        
      } catch (error) {
        console.error('Error generating iCal:', error);
        return json({ error: "Error generating calendar file" }, { status: 500 });
      }

    case "update_status":
      const prospectId = formData.get("prospectId") as string;
      const newStatus = formData.get("status") as string;
      
      await ProspectModel.update(prospectId, { 
        status: newStatus as any,
        updatedAt: new Date()
      });
      
      return json({ success: true });

    case "reassign_appointment":
      try {
        // Check if user is super admin
        const user = await requireClerkSuperAdmin(args);
        
        const appointmentProspectId = formData.get("prospectId") as string;
        const newVendedorId = formData.get("newVendedorId") as string;
        const reassignmentReason = formData.get("reason") as string;
        
        if (!appointmentProspectId || !newVendedorId || !reassignmentReason) {
          return json({ error: "Missing required fields" }, { status: 400 });
        }
        
        const updatedProspect = await ProspectModel.reassignProspect(
          appointmentProspectId,
          newVendedorId,
          user.clerkId,
          reassignmentReason
        );
        
        if (!updatedProspect) {
          return json({ error: "Prospect not found" }, { status: 404 });
        }
        
        return json({ success: true, message: "Cita reasignada exitosamente" });
        
      } catch (error) {
        console.error('Error reassigning appointment:', error);
        return json({ error: "Error reassigning appointment" }, { status: 500 });
      }

    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
}

export default function AdminCitasPage() {
  const { appointments, sellers, userPermissions } = useLoaderData<typeof loader>();

  return (
    <AdminLayout>
      <AdminAppointmentsBoard 
        appointments={appointments} 
        sellers={sellers}
        userPermissions={userPermissions}
      />
    </AdminLayout>
  );
}