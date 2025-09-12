import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, useLoaderData, useNavigation, useActionData } from "@remix-run/react"
import { requireClerkSuperAdmin } from "~/lib/auth-clerk.server"
import { getClerkClient } from "~/lib/clerk.server"
import { ClerkRoles } from "~/lib/clerk-roles.server"
import { EnhancedRoles } from "~/lib/enhanced-roles.server"
import { AdminLayout } from "~/components/admin/AdminLayout"
import { AccesoSeguridadComponent } from "~/components/admin/AccesoSeguridadComponent"

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkSuperAdmin(args)
  
  try {
    const clerkClient = getClerkClient()
    const usersResponse = await clerkClient.users.getUserList({ limit: 1000 })
    
    // Calcular estadísticas de roles incluyendo roles personalizados
    const roleStats = {
      user: 0,
      admin: 0,
      superadmin: 0,
      custom: 0
    }
    
    const customRoles = new Set<string>()
    
    usersResponse.data.forEach(user => {
      const userRole = (user.publicMetadata?.role as string) || 'user'
      if (userRole in roleStats) {
        roleStats[userRole as keyof typeof roleStats]++
      } else {
        // Es un rol personalizado
        roleStats.custom++
        customRoles.add(userRole)
      }
    })
    
    // Obtener usuarios con roles administrativos (incluyendo roles personalizados)
    const adminUsers = usersResponse.data.filter(user => {
      const role = (user.publicMetadata?.role as string) || 'user'
      return role === 'admin' || role === 'superadmin' || !['user'].includes(role)
    })
    
    // Obtener roles disponibles del sistema
    const availableRoles = await EnhancedRoles.getAllRoles()
    const systemPermissions = EnhancedRoles.SYSTEM_PERMISSIONS
    const permissionsByCategory = EnhancedRoles.getPermissionsByCategory()
    
    return json({ 
      roleStats,
      adminUsers,
      totalUsers: usersResponse.data.length,
      availableRoles,
      systemPermissions,
      permissionsByCategory,
      customRoleCount: customRoles.size
    })
  } catch (error) {
    console.error('Error loading security data:', error)
    throw new Response("Error al cargar datos de seguridad", { status: 500 })
  }
}

export async function action(args: ActionFunctionArgs) {
  await requireClerkSuperAdmin(args)
  
  const { request } = args
  const formData = await request.formData()
  const intent = formData.get("intent") as string
  const userId = formData.get("userId") as string
  const newRole = formData.get("newRole") as string
  
  // Obtener el usuario actual para el log de auditoría
  const { user } = await requireClerkSuperAdmin(args)
  const currentUserId = user.id
  
  try {
    switch (intent) {
      case "create-role": {
        const roleName = formData.get("roleName") as string
        const roleDescription = formData.get("roleDescription") as string
        const selectedPermissions = formData.getAll("permissions") as string[]
        
        if (!roleName) {
          return json({ error: "Nombre del rol es requerido" }, { status: 400 })
        }
        
        // Validar que los permisos sean válidos
        const validPermissions = selectedPermissions.filter(permission =>
          EnhancedRoles.isValidPermission(permission)
        )
        
        const success = await EnhancedRoles.createCustomRole(
          {
            name: roleName,
            description: roleDescription || `Rol personalizado: ${roleName}`,
            permissions: validPermissions
          },
          currentUserId
        )
        
        if (!success) {
          return json({ error: "Error al crear el rol personalizado" }, { status: 500 })
        }
        
        return json({ 
          success: true, 
          message: `Rol "${roleName}" creado exitosamente con ${validPermissions.length} permisos` 
        })
      }
      
      case "update-role": {
        if (!userId || !newRole) {
          return json({ error: "Datos del rol no válidos" }, { status: 400 })
        }
        
        // Usar el sistema mejorado de roles
        const success = await EnhancedRoles.assignRoleToUser(userId, newRole, currentUserId)
        
        if (!success) {
          return json({ error: "Error al actualizar el rol del usuario" }, { status: 500 })
        }
        
        return json({ 
          success: true, 
          message: `Rol actualizado exitosamente a ${newRole}` 
        })
      }
      
      case "update-permissions": {
        const customPermissions = formData.getAll("customPermissions") as string[]
        
        if (!userId) {
          return json({ error: "ID de usuario es requerido" }, { status: 400 })
        }
        
        // Validar permisos
        const validPermissions = customPermissions.filter(permission =>
          EnhancedRoles.isValidPermission(permission)
        )
        
        // Obtener el rol actual del usuario
        const roleDetails = await EnhancedRoles.getUserRoleDetails(userId)
        if (!roleDetails) {
          return json({ error: "Usuario no encontrado" }, { status: 404 })
        }
        
        // Asignar el mismo rol pero con permisos personalizados adicionales
        const success = await EnhancedRoles.assignRoleToUser(
          userId, 
          roleDetails.role, 
          currentUserId, 
          validPermissions
        )
        
        if (!success) {
          return json({ error: "Error al actualizar los permisos" }, { status: 500 })
        }
        
        return json({ 
          success: true, 
          message: `Permisos personalizados actualizados (${validPermissions.length} permisos añadidos)` 
        })
      }
      
      case "delete-role": {
        const roleId = formData.get("roleId") as string
        
        if (!roleId) {
          return json({ error: "ID del rol es requerido" }, { status: 400 })
        }
        
        const success = await EnhancedRoles.deleteCustomRole(roleId)
        
        if (!success) {
          return json({ error: "Error al eliminar el rol" }, { status: 500 })
        }
        
        return json({ 
          success: true, 
          message: `Rol eliminado exitosamente` 
        })
      }
      
      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error en action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export default function AdminAccesoSeguridad() {
  const data = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  
  return (
    <AdminLayout>
      <AccesoSeguridadComponent 
        data={data}
        actionData={actionData}
        isSubmitting={navigation.state === "submitting"}
      />
    </AdminLayout>
  )
}