import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit, useActionData } from "@remix-run/react"
import { requireClerkSuperAdmin } from "~/lib/auth-clerk.server"
import { getClerkClient } from "~/lib/clerk.server"
import { ClerkRoles } from "~/lib/clerk-roles.server"
import { AdminLayout } from "~/components/admin/AdminLayout"
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { 
  UserIcon as UserIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  ShieldExclamationIcon as ShieldExclamationIconSolid
} from '@heroicons/react/24/solid'
import { useState } from 'react'

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkSuperAdmin(args)
  
  const { request } = args
  const url = new URL(request.url)
  const search = url.searchParams.get("search") || ""
  const role = url.searchParams.get("role") || ""
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = 20
  const offset = (page - 1) * limit
  
  try {
    const clerkClient = getClerkClient()
    
    // Obtener usuarios de Clerk
    const usersResponse = await clerkClient.users.getUserList({
      limit,
      offset,
      query: search || undefined,
    })
    
    // Filtrar por rol si se especifica
    let filteredUsers = usersResponse.data
    if (role) {
      filteredUsers = usersResponse.data.filter(user => {
        const userRole = (user.publicMetadata?.role as string) || 'user'
        return userRole === role
      })
    }
    
    // Calcular estadísticas
    const allUsersResponse = await clerkClient.users.getUserList({ limit: 1000 })
    const stats = {
      total: allUsersResponse.data.length,
      byRole: {
        user: 0,
        admin: 0,
        superadmin: 0
      }
    }
    
    allUsersResponse.data.forEach(user => {
      const userRole = (user.publicMetadata?.role as string) || 'user'
      if (userRole in stats.byRole) {
        stats.byRole[userRole as keyof typeof stats.byRole]++
      }
    })
    
    return json({ 
      users: filteredUsers,
      stats,
      currentPage: page,
      totalPages: Math.ceil(stats.total / limit),
      filters: { search, role }
    })
  } catch (error) {
    console.error('Error loading Clerk users:', error)
    throw new Response("Error al cargar usuarios", { status: 500 })
  }
}

export async function action(args: ActionFunctionArgs) {
  await requireClerkSuperAdmin(args)
  
  const { request } = args
  const formData = await request.formData()
  const intent = formData.get("intent") as string
  const userId = formData.get("userId") as string
  const newRole = formData.get("newRole") as string
  
  if (!userId) {
    return json({ error: "ID del usuario es requerido" }, { status: 400 })
  }
  
  try {
    switch (intent) {
      case "change-role": {
        if (!newRole || !['user', 'admin', 'superadmin'].includes(newRole)) {
          return json({ error: "Rol no válido" }, { status: 400 })
        }
        
        const success = await ClerkRoles.changeUserRole(userId, newRole as any)
        if (!success) {
          return json({ error: "Error al cambiar el rol del usuario" }, { status: 500 })
        }
        
        return json({ 
          success: true, 
          message: `Rol actualizado a ${newRole} exitosamente` 
        })
      }
      
      case "ban-user": {
        const clerkClient = getClerkClient()
        await clerkClient.users.banUser(userId)
        return json({ 
          success: true, 
          message: "Usuario bloqueado exitosamente" 
        })
      }
      
      case "unban-user": {
        const clerkClient = getClerkClient()
        await clerkClient.users.unbanUser(userId)
        return json({ 
          success: true, 
          message: "Usuario desbloqueado exitosamente" 
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

export default function AdminClerkUsers() {
  const { users, stats, currentPage, totalPages, filters } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const submit = useSubmit()
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  
  const isSubmitting = navigation.state === "submitting"
  
  const roleOptions = [
    { value: "", label: "Todos los roles" },
    { value: "user", label: "Usuarios" },
    { value: "admin", label: "Administradores" },
    { value: "superadmin", label: "Super Administradores" }
  ]
  
  const clearFilters = () => {
    submit({}, { method: "get" })
  }
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            <ShieldCheckIconSolid className="w-3 h-3" />
            Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            <ShieldExclamationIconSolid className="w-3 h-3" />
            Admin
          </span>
        )
      case 'user':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <UserIconSolid className="w-3 h-3" />
            Usuario
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <UserIconSolid className="w-3 h-3" />
            Usuario
          </span>
        )
    }
  }
  
  const getStatusBadge = (banned: boolean) => {
    return banned ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        <XCircleIcon className="w-3 h-3" />
        Bloqueado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        <CheckCircleIcon className="w-3 h-3" />
        Activo
      </span>
    )
  }
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">
            {stats.total} usuarios registrados en la plataforma
          </p>
        </div>
        
        {/* Success/Error Messages */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{actionData.message}</p>
            </div>
          </div>
        )}
        
        {actionData && 'error' in actionData && actionData.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{actionData.error}</p>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500 mt-1">Todos los registros</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Normales</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byRole.user || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Rol estándar</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserIconSolid className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byRole.admin || 0}</p>
                <p className="text-sm text-blue-600 mt-1">Permisos elevados</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShieldExclamationIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Super Admins</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byRole.superadmin || 0}</p>
                <p className="text-sm text-purple-600 mt-1">Control total</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Form method="get" className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex gap-2">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="search"
                    name="search"
                    defaultValue={filters.search}
                    placeholder="Buscar por nombre, email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border transition-colors ${
                    showFilters ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>
              </div>
              
              {showFilters && (
                <div className="flex flex-wrap gap-3">
                  <select
                    name="role"
                    defaultValue={filters.role}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  {(filters.search || filters.role) && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Buscar
              </button>
            </Form>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user: any) => {
                    const userRole = (user.publicMetadata?.role as string) || 'user'
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-3">
                              {user.imageUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.imageUrl}
                                  alt={`${user.firstName} ${user.lastName}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.emailAddresses[0]?.emailAddress}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.phoneNumbers?.[0]?.phoneNumber || 'Sin teléfono'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(userRole)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.banned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative">
                              <button
                                onClick={() => setActionUserId(actionUserId === user.id ? null : user.id)}
                                className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                title="Gestionar usuario"
                              >
                                <Cog6ToothIcon className="w-4 h-4" />
                              </button>
                              
                              {actionUserId === user.id && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                  <div className="py-1">
                                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                      Cambiar Rol
                                    </div>
                                    
                                    {['user', 'admin', 'superadmin'].map((role) => (
                                      <Form key={role} method="post" className="block">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input type="hidden" name="intent" value="change-role" />
                                        <input type="hidden" name="newRole" value={role} />
                                        <button
                                          type="submit"
                                          disabled={userRole === role}
                                          className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2 ${
                                            userRole === role ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                                          }`}
                                        >
                                          {role === 'superadmin' && <ShieldCheckIcon className="w-4 h-4 text-purple-600" />}
                                          {role === 'admin' && <ShieldExclamationIcon className="w-4 h-4 text-blue-600" />}
                                          {role === 'user' && <UserIcon className="w-4 h-4 text-gray-600" />}
                                          {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Usuario'}
                                          {userRole === role && <span className="ml-auto text-xs">(Actual)</span>}
                                        </button>
                                      </Form>
                                    ))}
                                    
                                    <div className="border-t border-gray-100 my-1"></div>
                                    
                                    {user.banned ? (
                                      <Form method="post" className="block">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input type="hidden" name="intent" value="unban-user" />
                                        <button
                                          type="submit"
                                          className="w-full px-4 py-2 text-sm text-left text-green-600 hover:bg-green-50 flex items-center gap-2"
                                        >
                                          <CheckCircleIcon className="w-4 h-4" />
                                          Desbloquear Usuario
                                        </button>
                                      </Form>
                                    ) : (
                                      <Form method="post" className="block">
                                        <input type="hidden" name="userId" value={user.id} />
                                        <input type="hidden" name="intent" value="ban-user" />
                                        <button
                                          type="submit"
                                          className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                          onClick={(e) => {
                                            if (!confirm("¿Estás seguro de bloquear este usuario?")) {
                                              e.preventDefault()
                                            }
                                          }}
                                        >
                                          <XCircleIcon className="w-4 h-4" />
                                          Bloquear Usuario
                                        </button>
                                      </Form>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron usuarios con los filtros aplicados.
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> a <span className="font-medium">
                      {Math.min(currentPage * 20, stats.total)}
                    </span> de <span className="font-medium">{stats.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Link
                      to={`?${new URLSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: (currentPage - 1).toString()
                      })}`}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      aria-disabled={currentPage === 1}
                      tabIndex={currentPage === 1 ? -1 : 0}
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      
                      return (
                        <Link
                          key={page}
                          to={`?${new URLSearchParams({
                            ...Object.fromEntries(searchParams.entries()),
                            page: page.toString()
                          })}`}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </Link>
                      );
                    })}
                    
                    <Link
                      to={`?${new URLSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: (currentPage + 1).toString()
                      })}`}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                      aria-disabled={currentPage === totalPages}
                      tabIndex={currentPage === totalPages ? -1 : 0}
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}