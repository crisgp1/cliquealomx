import { getClerkClient } from './clerk.server'
import { UserModel } from '~/models/User.server'
import type { User } from '~/models/User.server'

export type ClerkRole = 'user' | 'admin' | 'superadmin'

/**
 * Utilidades para manejar roles con Clerk
 */
export const ClerkRoles = {
  /**
   * Obtiene o crea un usuario desde Clerk y sincroniza con la base de datos
   */
  async getOrCreateUser(clerkUserId: string): Promise<User | null> {
    try {
      // Buscar usuario existente por Clerk ID
      let user = await UserModel.findByClerkId(clerkUserId)
      
      if (!user) {
        // Si no existe, obtener datos de Clerk y crear usuario
        const clerkClient = getClerkClient()
        const clerkUser = await clerkClient.users.getUser(clerkUserId)
        
        // Obtener el rol desde Clerk metadata ANTES de crear el usuario
        const clerkRole = (clerkUser.publicMetadata?.role as ClerkRole) || 'user'
        
        user = await UserModel.createFromClerk({
          id: clerkUser.id,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          emailAddresses: clerkUser.emailAddresses,
          phoneNumbers: clerkUser.phoneNumbers || undefined,
          imageUrl: clerkUser.imageUrl || undefined
        })
        
        // Si el rol en Clerk metadata es diferente al por defecto, actualizarlo
        if (clerkRole !== 'user') {
          console.log(`🔄 Actualizando rol de usuario recién creado a: ${clerkRole}`)
          await UserModel.syncRoleWithClerk(user._id!.toString(), clerkRole)
          user.role = clerkRole // Actualizar el objeto en memoria también
        }
        
        console.log(`✅ Usuario creado con rol: ${user.role}`)
      }
      
      return user
    } catch (error) {
      console.error('Error getting or creating user:', error)
      return null
    }
  },

  /**
   * Actualiza el rol de un usuario en Clerk metadata
   */
  async syncRoleToClerk(clerkUserId: string, role: ClerkRole): Promise<boolean> {
    try {
      const clerkClient = getClerkClient()
      await clerkClient.users.updateUser(clerkUserId, {
        publicMetadata: {
          role
        }
      })
      return true
    } catch (error) {
      console.error('Error syncing role to Clerk:', error)
      return false
    }
  },

  /**
   * Obtiene el rol desde Clerk metadata
   */
  async getRoleFromClerk(clerkUserId: string): Promise<ClerkRole> {
    try {
      const clerkClient = getClerkClient()
      const clerkUser = await clerkClient.users.getUser(clerkUserId)
      const role = clerkUser.publicMetadata?.role as ClerkRole
      return role || 'user'
    } catch (error) {
      console.error('Error getting role from Clerk:', error)
      return 'user'
    }
  },

  /**
   * Cambia el rol de un usuario (actualiza tanto DB como Clerk)
   */
  async changeUserRole(clerkUserId: string, newRole: ClerkRole): Promise<boolean> {
    try {
      console.log(`🔄 Cambiando rol de usuario ${clerkUserId} a ${newRole}`)
      
      // Primero actualizar en Clerk (esto es lo más importante)
      const clerkSuccess = await this.syncRoleToClerk(clerkUserId, newRole)
      if (!clerkSuccess) {
        console.error('❌ Error actualizando rol en Clerk')
        return false
      }
      
      console.log('✅ Rol actualizado en Clerk exitosamente')

      // Buscar usuario en la base de datos local
      const user = await UserModel.findByClerkId(clerkUserId)
      
      if (user) {
        // Si existe en la DB local, actualizarlo también
        console.log('🔄 Actualizando rol en base de datos local')
        const dbSuccess = await UserModel.syncRoleWithClerk(user._id!.toString(), newRole)
        if (!dbSuccess) {
          console.warn('⚠️ Error actualizando rol en DB local, pero Clerk fue actualizado exitosamente')
        } else {
          console.log('✅ Rol actualizado en DB local exitosamente')
        }
      } else {
        console.log('ℹ️ Usuario no existe en DB local, solo actualizado en Clerk')
      }
      
      return true
    } catch (error) {
      console.error('Error changing user role:', error)
      return false
    }
  },

  /**
   * Verifica permisos basado en el rol
   */
  hasPermission(role: ClerkRole, permission: string): boolean {
    const permissions = {
      user: ['view_listings', 'like_listings', 'edit_profile'],
      admin: [
        'view_listings', 'like_listings', 'edit_profile',
        'create_listings', 'edit_own_listings', 'delete_own_listings',
        'view_admin_panel', 'manage_credit_applications'
      ],
      superadmin: [
        'view_listings', 'like_listings', 'edit_profile',
        'create_listings', 'edit_own_listings', 'delete_own_listings',
        'view_admin_panel', 'manage_credit_applications',
        'edit_any_listing', 'delete_any_listing', 'manage_users',
        'change_user_roles', 'view_system_stats'
      ]
    }

    return permissions[role]?.includes(permission) || false
  },

  /**
   * Verifica si un usuario puede crear listings
   */
  canCreateListings(role: ClerkRole): boolean {
    return this.hasPermission(role, 'create_listings')
  },

  /**
   * Verifica si un usuario puede editar un listing específico
   */
  canEditListing(role: ClerkRole, listing: any, clerkUserId: string): boolean {
    if (role === 'superadmin') return true
    if (role === 'admin' && listing.user === clerkUserId) return true
    return false
  },

  /**
   * Verifica si un usuario puede acceder al panel de administración
   */
  canAccessAdminPanel(role: ClerkRole): boolean {
    return role === 'admin' || role === 'superadmin'
  },

  /**
   * Verifica si un usuario puede gestionar otros usuarios
   */
  canManageUsers(role: ClerkRole): boolean {
    return role === 'superadmin'
  }
}