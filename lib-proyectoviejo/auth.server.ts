import { redirect } from '@remix-run/node'
import { getUser, requireUser } from './session.server'
import type { User } from '~/models/User.server'

// Re-export requireUser function from session.server
export { requireUser }

// Export auth functions as a named object to avoid potential naming conflicts
export const Auth = {
  /**
   * Verifica si un usuario puede crear listings (solo admin y superadmin)
   */
  canCreateListings(user: User | null) {
    if (!user) return false
    return user.role === 'admin' || user.role === 'superadmin'
  },

  /**
   * Verifica si un usuario puede editar un listing específico
   * - Los superadmin pueden editar cualquier listing
   * - Los admin solo pueden editar sus propios listings
   * - Los usuarios normales no pueden editar ningún listing
   */
  canEditListing(user: User | null, listing: any) {
    if (!user) return false
    
    // SuperAdmin puede editar cualquier listing
    if (user.role === 'superadmin') return true
    
    // Admin solo puede editar sus propios listings
    if (user.role === 'admin') {
      // Verificar si el usuario es el creador del listing
      return user._id?.toString() === listing.user.toString()
    }
    
    // Usuarios normales no pueden editar
    return false
  },

  /**
   * Verifica si un usuario puede eliminar un listing específico
   * Mismas reglas que para editar
   */
  canDeleteListing(user: User | null, listing: any) {
    return this.canEditListing(user, listing)
  },

  /**
   * Verifica si un usuario puede gestionar otros usuarios (solo superadmin)
   */
  canManageUsers(user: User | null) {
    if (!user) return false
    return user.role === 'superadmin'
  },

  /**
   * Verifica si un usuario puede ver el panel de administración
   */
  canAccessAdminPanel(user: User | null) {
    if (!user) return false
    return user.role === 'admin' || user.role === 'superadmin'
  }
}

/**
 * Middleware que verifica que el usuario sea admin o superadmin
 * Redirige a la página principal con error si no tiene permisos
 */
export async function requireAdmin(request: Request) {
  const user = await requireUser(request)
  
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw redirect('/?error=unauthorized')
  }
  
  return user
}

/**
 * Middleware que verifica que el usuario sea superadmin
 * Redirige a la página principal con error si no tiene permisos
 */
export async function requireSuperAdmin(request: Request) {
  const user = await requireUser(request)
  
  if (user.role !== 'superadmin') {
    throw redirect('/?error=unauthorized')
  }
  
  return user
}


/**
 * Obtiene el usuario de la sesión si existe
 * No lanza redirección si no hay usuario
 */
export async function getCurrentUser(request: Request) {
  return await getUser(request)
}