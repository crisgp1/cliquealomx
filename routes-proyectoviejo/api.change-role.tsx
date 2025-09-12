import { json, type ActionFunctionArgs } from '@remix-run/node'
import { requireClerkSuperAdmin } from '~/lib/auth-clerk.server'
import { ClerkRoles } from '~/lib/clerk-roles.server'
import { UserModel } from '~/models/User.server'

export async function action(args: ActionFunctionArgs) {
  try {
    // Verificar que el usuario sea superadmin
    const currentUser = await requireClerkSuperAdmin(args)
    
    const formData = await args.request.formData()
    const intent = formData.get('intent') as string
    const userId = formData.get('userId') as string
    const newRole = formData.get('newRole') as 'user' | 'admin' | 'superadmin'

    if (intent !== 'change-role') {
      return json({ error: 'Acción no válida' }, { status: 400 })
    }

    if (!userId || !newRole) {
      return json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      return json({ error: 'Rol no válido' }, { status: 400 })
    }

    // Buscar el usuario objetivo
    const targetUser = await UserModel.findById(userId)
    if (!targetUser) {
      return json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir que se cambie su propio rol
    if (currentUser._id!.toString() === userId) {
      return json({ error: 'No puedes cambiar tu propio rol' }, { status: 400 })
    }

    // Si el usuario objetivo tiene clerkId, actualizar en Clerk también
    if (targetUser.clerkId) {
      const success = await ClerkRoles.changeUserRole(targetUser.clerkId, newRole)
      if (!success) {
        return json({ error: 'Error al actualizar rol en Clerk' }, { status: 500 })
      }
    } else {
      // Si no tiene clerkId, solo actualizar en la base de datos
      const success = await UserModel.syncRoleWithClerk(userId, newRole)
      if (!success) {
        return json({ error: 'Error al actualizar rol en la base de datos' }, { status: 500 })
      }
    }

    return json({ 
      success: true, 
      message: `Rol actualizado a ${newRole} correctamente`,
      userId,
      newRole
    })

  } catch (error) {
    console.error('Error changing user role:', error)
    return json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// No permitir GET requests
export async function loader() {
  return json({ error: 'Método no permitido' }, { status: 405 })
}