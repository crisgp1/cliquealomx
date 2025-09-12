import { getClerkClient } from './clerk.server'
import { ClerkRoles, type ClerkRole } from './clerk-roles.server'

export interface CustomRole {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystemRole: boolean
  color: string
  createdAt: Date
  createdBy: string
}

export interface UserRoleData {
  clerkUserId: string
  role: string
  customPermissions?: string[]
  assignedAt: Date
  assignedBy: string
}

/**
 * Enhanced role management system that supports dynamic role creation
 * Uses Clerk's privateMetadata to store custom roles and extended permissions
 */
export const EnhancedRoles = {
  /**
   * System permissions registry with detailed descriptions and security levels
   */
  SYSTEM_PERMISSIONS: [
    { 
      id: 'view_dashboard', 
      name: 'Ver Dashboard', 
      category: 'General',
      description: 'Permite acceder al panel principal del sistema donde se muestran estadísticas generales, métricas de rendimiento y resúmenes de actividad.',
      riskLevel: 'low',
      examples: ['Visualizar gráficos de ventas', 'Ver resumen de usuarios activos', 'Acceder a métricas generales']
    },
    { 
      id: 'manage_users', 
      name: 'Gestionar Usuarios', 
      category: 'Usuarios',
      description: 'Control total sobre las cuentas de usuario: crear, editar, eliminar y cambiar roles. Este es un permiso de alto riesgo que debe asignarse con extrema precaución.',
      riskLevel: 'critical',
      examples: ['Crear nuevas cuentas de usuario', 'Cambiar roles de usuarios', 'Eliminar cuentas de usuario', 'Modificar información personal'],
      warning: 'ATENCIÓN: Este permiso otorga control total sobre las cuentas de usuario y puede comprometer la seguridad del sistema.'
    },
    { 
      id: 'view_users', 
      name: 'Ver Usuarios', 
      category: 'Usuarios',
      description: 'Permite consultar la lista de usuarios registrados y ver su información básica como nombres, emails y roles asignados.',
      riskLevel: 'medium',
      examples: ['Ver lista de usuarios registrados', 'Consultar información de contacto', 'Revisar roles asignados']
    },
    { 
      id: 'edit_users', 
      name: 'Editar Usuarios', 
      category: 'Usuarios',
      description: 'Permite modificar la información de los usuarios existentes como datos personales, información de contacto y configuraciones de cuenta.',
      riskLevel: 'high',
      examples: ['Actualizar datos personales', 'Modificar información de contacto', 'Cambiar configuraciones de cuenta'],
      warning: 'Puede modificar información sensible de usuarios.'
    },
    { 
      id: 'delete_users', 
      name: 'Eliminar Usuarios', 
      category: 'Usuarios',
      description: 'Capacidad para eliminar permanentemente cuentas de usuario del sistema. Esta acción es irreversible y debe usarse con extrema precaución.',
      riskLevel: 'critical',
      examples: ['Eliminar cuentas de usuario permanentemente', 'Remover historial de usuario', 'Cancelar membresías'],
      warning: 'PELIGRO: La eliminación de usuarios es permanente e irreversible.'
    },
    { 
      id: 'ban_users', 
      name: 'Bloquear Usuarios', 
      category: 'Usuarios',
      description: 'Permite suspender temporalmente o bloquear permanentemente el acceso de usuarios al sistema por violaciones de términos o comportamiento inapropiado.',
      riskLevel: 'high',
      examples: ['Suspender acceso temporal', 'Bloquear usuarios problemáticos', 'Aplicar restricciones de acceso']
    },
    { 
      id: 'manage_listings', 
      name: 'Gestionar Listings', 
      category: 'Inventario',
      description: 'Control completo sobre todos los listings de vehículos: crear, editar, eliminar y administrar el inventario completo de la plataforma.',
      riskLevel: 'high',
      examples: ['Modificar cualquier listing', 'Cambiar precios de vehículos', 'Gestionar inventario completo', 'Aprobar/rechazar publicaciones']
    },
    { 
      id: 'create_listings', 
      name: 'Crear Listings', 
      category: 'Inventario',
      description: 'Permite agregar nuevos vehículos al inventario del sistema, incluyendo toda la información del auto, precios, fotos y descripciones.',
      riskLevel: 'medium',
      examples: ['Publicar nuevos vehículos', 'Subir fotos de autos', 'Establecer precios iniciales', 'Crear descripciones detalladas']
    },
    { 
      id: 'edit_listings', 
      name: 'Editar Listings', 
      category: 'Inventario',
      description: 'Capacidad para modificar listings existentes, actualizar precios, cambiar descripciones y actualizar el estado de los vehículos.',
      riskLevel: 'medium',
      examples: ['Actualizar precios de vehículos', 'Modificar descripciones', 'Cambiar estado de disponibilidad', 'Actualizar fotos']
    },
    { 
      id: 'delete_listings', 
      name: 'Eliminar Listings', 
      category: 'Inventario',
      description: 'Permite remover permanentemente listings del sistema. Útil para vehículos vendidos o que ya no están disponibles.',
      riskLevel: 'medium',
      examples: ['Eliminar vehículos vendidos', 'Remover listings obsoletos', 'Limpiar inventario']
    },
    { 
      id: 'view_analytics', 
      name: 'Ver Analíticas', 
      category: 'Reportes',
      description: 'Acceso a reportes detallados, estadísticas de ventas, métricas de rendimiento y análisis de datos del negocio.',
      riskLevel: 'medium',
      examples: ['Ver reportes de ventas', 'Analizar métricas de usuarios', 'Consultar estadísticas de inventario', 'Revisar tendencias del mercado']
    },
    { 
      id: 'export_data', 
      name: 'Exportar Datos', 
      category: 'Reportes',
      description: 'Permite descargar y exportar datos del sistema en diversos formatos (Excel, PDF, CSV) para análisis externos o respaldos.',
      riskLevel: 'high',
      examples: ['Exportar listas de clientes', 'Descargar reportes de ventas', 'Generar respaldos de datos'],
      warning: 'Puede exportar información sensible del negocio.'
    },
    { 
      id: 'manage_contracts', 
      name: 'Gestionar Contratos', 
      category: 'Ventas',
      description: 'Control total sobre los contratos de venta: crear, editar, aprobar y gestionar todo el proceso contractual de las transacciones.',
      riskLevel: 'high',
      examples: ['Crear contratos de venta', 'Aprobar términos contractuales', 'Modificar condiciones de pago', 'Gestionar documentación legal']
    },
    { 
      id: 'view_contracts', 
      name: 'Ver Contratos', 
      category: 'Ventas',
      description: 'Permite consultar contratos existentes, revisar términos de venta y acceder al historial de transacciones contractuales.',
      riskLevel: 'medium',
      examples: ['Consultar contratos firmados', 'Revisar términos de venta', 'Ver historial de transacciones']
    },
    { 
      id: 'manage_prospects', 
      name: 'Gestionar Prospectos', 
      category: 'Ventas',
      description: 'Administración completa del pipeline de ventas: crear, editar, asignar y dar seguimiento a clientes potenciales.',
      riskLevel: 'medium',
      examples: ['Crear nuevos prospectos', 'Asignar clientes a vendedores', 'Actualizar estado de seguimiento', 'Gestionar pipeline de ventas']
    },
    { 
      id: 'view_prospects', 
      name: 'Ver Prospectos', 
      category: 'Ventas',
      description: 'Acceso para consultar la base de datos de clientes potenciales y revisar el estado de oportunidades de venta.',
      riskLevel: 'low',
      examples: ['Ver lista de clientes potenciales', 'Consultar información de contacto', 'Revisar historial de interacciones']
    },
    { 
      id: 'manage_appointments', 
      name: 'Gestionar Citas', 
      category: 'Ventas',
      description: 'Control del sistema de citas: programar, modificar, cancelar y gestionar la agenda de encuentros con clientes.',
      riskLevel: 'low',
      examples: ['Programar citas con clientes', 'Modificar horarios', 'Cancelar reuniones', 'Gestionar calendario de ventas']
    },
    { 
      id: 'system_settings', 
      name: 'Configuración del Sistema', 
      category: 'Sistema',
      description: 'Acceso a la configuración crítica del sistema que puede afectar el funcionamiento de toda la plataforma. Permiso de máximo riesgo.',
      riskLevel: 'critical',
      examples: ['Modificar configuraciones globales', 'Cambiar parámetros del sistema', 'Actualizar integraciones'],
      warning: 'PELIGRO EXTREMO: Puede afectar el funcionamiento de toda la plataforma.'
    },
    { 
      id: 'manage_roles', 
      name: 'Gestionar Roles', 
      category: 'Sistema',
      description: 'Control total sobre el sistema de roles y permisos. Permite crear, modificar y eliminar roles, así como asignar permisos críticos.',
      riskLevel: 'critical',
      examples: ['Crear nuevos roles', 'Modificar permisos', 'Asignar roles a usuarios', 'Eliminar roles del sistema'],
      warning: 'MÁXIMO RIESGO: Control total sobre la seguridad del sistema.'
    },
    { 
      id: 'view_system_logs', 
      name: 'Ver Logs del Sistema', 
      category: 'Sistema',
      description: 'Acceso a los registros de actividad del sistema, logs de errores y auditoría de acciones realizadas por usuarios.',
      riskLevel: 'medium',
      examples: ['Revisar logs de errores', 'Consultar auditoría de usuarios', 'Ver historial de actividades del sistema']
    },
    { 
      id: 'create_custom_roles', 
      name: 'Crear Roles Personalizados', 
      category: 'Sistema',
      description: 'Capacidad para diseñar y crear nuevos roles con combinaciones específicas de permisos según las necesidades del negocio.',
      riskLevel: 'critical',
      examples: ['Diseñar roles específicos', 'Combinar permisos personalizados', 'Crear jerarquías de acceso'],
      warning: 'Puede crear roles con permisos elevados que comprometan la seguridad.'
    },
    { 
      id: 'manage_bank_partners', 
      name: 'Gestionar Aliados Bancarios', 
      category: 'Sistema',
      description: 'Administración de las integraciones y relaciones con entidades bancarias para servicios de financiamiento y crédito.',
      riskLevel: 'high',
      examples: ['Configurar integraciones bancarias', 'Gestionar APIs financieras', 'Administrar convenios bancarios']
    },
    { 
      id: 'manage_credit_simulator', 
      name: 'Gestionar Simulador de Crédito', 
      category: 'Sistema',
      description: 'Control sobre la herramienta de simulación de créditos, incluyendo tasas de interés, términos de financiamiento y cálculos.',
      riskLevel: 'high',
      examples: ['Configurar tasas de interés', 'Modificar términos de crédito', 'Actualizar calculadoras financieras']
    }
  ],

  /**
   * Default system roles
   */
  DEFAULT_ROLES: [
    {
      id: 'user',
      name: 'Usuario',
      description: 'Usuario estándar con permisos básicos',
      permissions: ['view_dashboard'],
      isSystemRole: true,
      color: 'gray'
    },
    {
      id: 'admin',
      name: 'Administrador',
      description: 'Administrador con permisos elevados',
      permissions: [
        'view_dashboard', 'manage_listings', 'create_listings', 'edit_listings',
        'view_contracts', 'manage_prospects', 'view_prospects', 'manage_appointments',
        'view_analytics', 'manage_contracts'
      ],
      isSystemRole: true,
      color: 'blue'
    },
    {
      id: 'superadmin',
      name: 'Super Administrador',
      description: 'Control total del sistema',
      permissions: [
        'view_dashboard', 'manage_users', 'view_users', 'edit_users', 'delete_users', 'ban_users',
        'manage_listings', 'create_listings', 'edit_listings', 'delete_listings',
        'view_analytics', 'export_data', 'manage_contracts', 'view_contracts',
        'manage_prospects', 'view_prospects', 'manage_appointments',
        'system_settings', 'manage_roles', 'view_system_logs', 'create_custom_roles',
        'manage_bank_partners', 'manage_credit_simulator'
      ],
      isSystemRole: true,
      color: 'purple'
    }
  ],

  /**
   * Get custom roles from system storage (in a real implementation, this would be from a database)
   * For now, we'll simulate with local storage or Clerk metadata
   */
  async getCustomRoles(): Promise<CustomRole[]> {
    try {
      // In a real implementation, you would fetch from a database
      // For now, we'll return an empty array and let the component manage state
      return []
    } catch (error) {
      console.error('Error getting custom roles:', error)
      return []
    }
  },

  /**
   * Create a new custom role
   */
  async createCustomRole(
    roleData: {
      name: string
      description: string
      permissions: string[]
    },
    createdBy: string
  ): Promise<boolean> {
    try {
      const roleId = roleData.name.toLowerCase().replace(/\s+/g, '_')
      
      // Validate permissions
      const validPermissions = roleData.permissions.filter(permission =>
        this.SYSTEM_PERMISSIONS.some(p => p.id === permission)
      )

      const customRole: CustomRole = {
        id: roleId,
        name: roleData.name,
        description: roleData.description,
        permissions: validPermissions,
        isSystemRole: false,
        color: 'green',
        createdAt: new Date(),
        createdBy
      }

      // In a real implementation, store in database
      console.log('Creating custom role:', customRole)
      
      return true
    } catch (error) {
      console.error('Error creating custom role:', error)
      return false
    }
  },

  /**
   * Update an existing custom role
   */
  async updateCustomRole(
    roleId: string,
    updates: Partial<CustomRole>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      // In a real implementation, update in database
      console.log('Updating custom role:', roleId, updates, 'by:', updatedBy)
      return true
    } catch (error) {
      console.error('Error updating custom role:', error)
      return false
    }
  },

  /**
   * Delete a custom role
   */
  async deleteCustomRole(roleId: string): Promise<boolean> {
    try {
      // Check if any users have this role
      const usersWithRole = await this.getUsersWithRole(roleId)
      if (usersWithRole.length > 0) {
        throw new Error('Cannot delete role that is assigned to users')
      }

      // In a real implementation, delete from database
      console.log('Deleting custom role:', roleId)
      return true
    } catch (error) {
      console.error('Error deleting custom role:', error)
      return false
    }
  },

  /**
   * Get all roles (system + custom)
   */
  async getAllRoles(): Promise<(typeof this.DEFAULT_ROLES[0] | CustomRole)[]> {
    const customRoles = await this.getCustomRoles()
    return [...this.DEFAULT_ROLES, ...customRoles]
  },

  /**
   * Assign a role to a user (supports both system and custom roles)
   */
  async assignRoleToUser(
    clerkUserId: string,
    roleId: string,
    assignedBy: string,
    customPermissions?: string[]
  ): Promise<boolean> {
    try {
      const clerkClient = getClerkClient()
      
      // Check if it's a system role
      const isSystemRole = this.DEFAULT_ROLES.some(role => role.id === roleId)
      
      if (isSystemRole) {
        // Use existing ClerkRoles system for system roles
        return await ClerkRoles.changeUserRole(clerkUserId, roleId as ClerkRole)
      } else {
        // Handle custom role assignment
        const customRole = await this.getCustomRoles().then(roles => 
          roles.find(role => role.id === roleId)
        )
        
        if (!customRole) {
          throw new Error('Custom role not found')
        }

        // Store custom role in Clerk privateMetadata
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            role: roleId // Keep role in publicMetadata for compatibility
          },
          privateMetadata: {
            customRole: {
              id: roleId,
              name: customRole.name,
              permissions: customRole.permissions,
              customPermissions: customPermissions || [],
              assignedAt: new Date().toISOString(),
              assignedBy
            }
          }
        })

        return true
      }
    } catch (error) {
      console.error('Error assigning role to user:', error)
      return false
    }
  },

  /**
   * Get user's effective permissions (role permissions + custom permissions)
   */
  async getUserPermissions(clerkUserId: string): Promise<string[]> {
    try {
      const clerkClient = getClerkClient()
      const user = await clerkClient.users.getUser(clerkUserId)
      
      const role = user.publicMetadata?.role as string
      const customRoleData = user.privateMetadata?.customRole as any

      let permissions: string[] = []

      // Get permissions from system role
      const systemRole = this.DEFAULT_ROLES.find(r => r.id === role)
      if (systemRole) {
        permissions = [...systemRole.permissions]
      }

      // Add custom role permissions
      if (customRoleData) {
        permissions = [...permissions, ...customRoleData.permissions]
        
        // Add individual custom permissions
        if (customRoleData.customPermissions) {
          permissions = [...permissions, ...customRoleData.customPermissions]
        }
      }

      // Remove duplicates
      return [...new Set(permissions)]
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  },

  /**
   * Check if user has specific permission
   */
  async userHasPermission(clerkUserId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(clerkUserId)
    return permissions.includes(permission)
  },

  /**
   * Get users with a specific role
   */
  async getUsersWithRole(roleId: string): Promise<any[]> {
    try {
      const clerkClient = getClerkClient()
      const usersResponse = await clerkClient.users.getUserList({ limit: 1000 })
      
      return usersResponse.data.filter(user => {
        const userRole = user.publicMetadata?.role as string
        return userRole === roleId
      })
    } catch (error) {
      console.error('Error getting users with role:', error)
      return []
    }
  },

  /**
   * Get detailed role information for a user
   */
  async getUserRoleDetails(clerkUserId: string): Promise<{
    role: string
    roleName: string
    permissions: string[]
    isCustomRole: boolean
    customRoleData?: any
  } | null> {
    try {
      const clerkClient = getClerkClient()
      const user = await clerkClient.users.getUser(clerkUserId)
      
      const role = user.publicMetadata?.role as string || 'user'
      const customRoleData = user.privateMetadata?.customRole as any

      // Check if it's a system role
      const systemRole = this.DEFAULT_ROLES.find(r => r.id === role)
      
      if (systemRole) {
        return {
          role,
          roleName: systemRole.name,
          permissions: systemRole.permissions,
          isCustomRole: false
        }
      }

      // Check custom role
      if (customRoleData) {
        return {
          role,
          roleName: customRoleData.name,
          permissions: await this.getUserPermissions(clerkUserId),
          isCustomRole: true,
          customRoleData
        }
      }

      // Fallback to user role
      return {
        role: 'user',
        roleName: 'Usuario',
        permissions: ['view_dashboard'],
        isCustomRole: false
      }
    } catch (error) {
      console.error('Error getting user role details:', error)
      return null
    }
  },

  /**
   * Validate permission exists in system
   */
  isValidPermission(permission: string): boolean {
    return this.SYSTEM_PERMISSIONS.some(p => p.id === permission)
  },

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(): Record<string, typeof this.SYSTEM_PERMISSIONS> {
    return this.SYSTEM_PERMISSIONS.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, typeof this.SYSTEM_PERMISSIONS>)
  }
}