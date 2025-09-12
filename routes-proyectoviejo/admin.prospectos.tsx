import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form, Link, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { requireClerkAdmin } from "~/lib/auth-clerk.server";
import { ProspectModel } from "~/models/Prospect.server";
import { ListingModel } from "~/models/Listing.server";
import { ProspectDetailModal } from "~/components/modals/ProspectDetailModal";
import { CreateProspectModal } from "~/components/modals/CreateProspectModal";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { usePermissions } from "~/hooks/useClerkRole";
import { 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Edit, 
  Trash2, 
  User, 
  Filter,
  Download,
  Plus,
  Eye,
  BarChart3
} from "lucide-react";

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkAdmin(args);
  const { request } = args;
  
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const source = url.searchParams.get("source") || "";
  const search = url.searchParams.get("search") || "";
  
  const filters: any = {};
  if (status) filters.status = status;
  if (source) filters.source = source;
  
  const [prospects, stats, listings] = await Promise.all([
    ProspectModel.findAll(filters),
    ProspectModel.getStats(),
    ListingModel.findMany({ limit: 50, status: 'active' })
  ]);
  
  // Filter by search term if provided
  const filteredProspects = search 
    ? prospects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
      )
    : prospects;
  
  return json({
    prospects: filteredProspects,
    stats,
    listings,
    filters: { status, source, search }
  });
}

export async function action(args: ActionFunctionArgs) {
  const user = await requireClerkAdmin(args);
  const { request } = args;
  
  const formData = await request.formData();
  const action = formData.get("_action") as string;
  const prospectId = formData.get("prospectId") as string;
  
  switch (action) {
    case "create_prospect":
      const prospectData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string || undefined,
        phone: formData.get("phone") as string,
        source: formData.get("source") as any,
        sourceDetails: formData.get("sourceDetails") as string || undefined,
        interestedListingId: formData.get("interestedListingId") as string || undefined,
        manualListingDescription: formData.get("manualListingDescription") as string || undefined,
        message: formData.get("message") as string || undefined,
        notes: formData.get("notes") as string || undefined,
      };

      // Handle budget
      const budgetMin = formData.get("budgetMin") as string;
      const budgetMax = formData.get("budgetMax") as string;
      if (budgetMin || budgetMax) {
        prospectData.budget = {
          min: budgetMin ? parseInt(budgetMin) : 0,
          max: budgetMax ? parseInt(budgetMax) : 0,
        };
      }

      // Get listing details if specified
      if (prospectData.interestedListingId && prospectData.interestedListingId !== "manual") {
        const listing = await ListingModel.findById(prospectData.interestedListingId);
        if (listing) {
          prospectData.interestedListingTitle = `${listing.brand} ${listing.model} ${listing.year}`;
        }
      }

      // Add the current user as the creator and initially assigned to them
      const prospectWithCreator = {
        ...prospectData,
        createdBy: user.clerkId, // Track who originally created this prospect (never changes)
        currentlyAssignedTo: user.clerkId, // Initially assigned to creator
      };
      
      await ProspectModel.create(prospectWithCreator);
      return json({ success: true });
      
    case "update_status":
      const newStatus = formData.get("status") as string;
      await ProspectModel.update(prospectId, { status: newStatus as any });
      break;
      
    case "schedule_appointment":
      const appointmentDate = formData.get("appointmentDate") as string;
      const appointmentNotes = formData.get("appointmentNotes") as string;
      const appointmentType = formData.get("appointmentType") as string;
      const duration = formData.get("duration") as string;
      const location = formData.get("location") as string;
      
      // Get the prospect to check if it needs a creator assignment
      const prospect = await ProspectModel.findById(prospectId);
      const updateData: any = {
        status: "appointment_scheduled",
        appointmentDate: new Date(appointmentDate),
        appointmentNotes,
        // Note: In a full implementation, you'd extend the Prospect model
        // to include appointmentType, duration, and location fields
      };
      
      // If prospect doesn't have a creator, assign the current user as both creator and currently assigned
      if (!prospect?.createdBy) {
        updateData.createdBy = user.clerkId;
        updateData.currentlyAssignedTo = user.clerkId;
      }
      // If prospect doesn't have current assignment, assign to creator or current user
      else if (!prospect?.currentlyAssignedTo) {
        updateData.currentlyAssignedTo = prospect.createdBy || user.clerkId;
      }
      
      await ProspectModel.update(prospectId, updateData);
      break;
      
    case "add_notes":
      const notes = formData.get("notes") as string;
      await ProspectModel.update(prospectId, { notes });
      break;
      
    case "delete":
      await ProspectModel.delete(prospectId);
      break;
  }
  
  return json({ success: true });
}

export default function AdminProspectosPage() {
  const { prospects, stats, listings, filters } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const permissions = usePermissions();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "Nuevo", variant: "default" as const },
      contacted: { label: "Contactado", variant: "secondary" as const },
      appointment_scheduled: { label: "Cita Agendada", variant: "outline" as const },
      qualified: { label: "Calificado", variant: "secondary" as const },
      converted: { label: "Convertido", variant: "default" as const },
      not_interested: { label: "No Interesado", variant: "destructive" as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceMap = {
      mercadolibre: "MercadoLibre",
      facebook: "Facebook", 
      instagram: "Instagram",
      whatsapp: "WhatsApp",
      website: "Página Web",
      referral: "Recomendación",
      other: "Otro"
    };
    
    return sourceMap[source as keyof typeof sourceMap] || source;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Prospectos</h1>
            <p className="text-gray-600">Administra y da seguimiento a tus leads</p>
          </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          {permissions.isSuperAdmin && (
            <Button asChild variant="outline">
              <Link to="/admin/super-prospectos">
                <BarChart3 className="h-4 w-4 mr-2" />
                Panel Super Admin
              </Link>
            </Button>
          )}
          {permissions.isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Prospecto
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos</p>
                <p className="text-2xl font-bold">{stats.byStatus.new || 0}</p>
              </div>
              <Badge variant="default" className="text-xs">Nuevos</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas</p>
                <p className="text-2xl font-bold">{stats.byStatus.appointment_scheduled || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold">{stats.recent}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                name="search"
                placeholder="Nombre, teléfono, email..."
                defaultValue={filters.search}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue={filters.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="contacted">Contactado</SelectItem>
                  <SelectItem value="appointment_scheduled">Cita Agendada</SelectItem>
                  <SelectItem value="qualified">Calificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="not_interested">No Interesado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="source">Origen</Label>
              <Select name="source" defaultValue={filters.source}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los orígenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="mercadolibre">MercadoLibre</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="website">Página Web</SelectItem>
                  <SelectItem value="referral">Recomendación</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Filtrar
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prospectos ({prospects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prospects.map((prospect) => (
              <div key={prospect._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{prospect.name}</h3>
                      {getStatusBadge(prospect.status)}
                      <Badge variant="outline">{getSourceBadge(prospect.source)}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {prospect.phone}
                      </div>
                      {prospect.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {prospect.email}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Creado:</span> {formatDate(prospect.createdAt)}
                      </div>
                    </div>
                    
                    {prospect.interestedListingTitle && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Interés:</span> {prospect.interestedListingTitle}
                      </div>
                    )}
                    
                    {prospect.manualListingDescription && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Busca:</span> {prospect.manualListingDescription}
                      </div>
                    )}
                    
                    {prospect.message && (
                      <div className="mt-2 text-sm bg-gray-100 p-2 rounded">
                        <span className="font-medium">Mensaje:</span> {prospect.message}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProspect(prospect);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Form method="post" style={{ display: 'inline' }}>
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="prospectId" value={prospect._id} />
                      <Button
                        size="sm"
                        variant="outline"
                        type="submit"
                        onClick={(e) => {
                          if (!confirm('¿Estás seguro de eliminar este prospecto?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Form>
                  </div>
                </div>
              </div>
            ))}
            
            {prospects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron prospectos con los filtros seleccionados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Prospect Modal - Available for all admins */}
      {permissions.isAdmin && (
        <CreateProspectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          listings={listings}
        />
      )}

      {/* Prospect Detail Modal */}
      <ProspectDetailModal
        prospect={selectedProspect}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProspect(null);
        }}
      />
      </div>
    </AdminLayout>
  );
}