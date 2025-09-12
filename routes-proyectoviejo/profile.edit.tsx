import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, useLoaderData, useNavigation, useActionData } from "@remix-run/react"
import { getClerkUser, requireClerkUser } from "~/lib/auth-clerk.server"
import { UserModel } from "~/models/User.server"
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Link } from "@remix-run/react"

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkUser(args)
  
  // Only allow admin and superadmin to edit their profiles
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw redirect('/?error=unauthorized')
  }
  
  return json({ user })
}

export async function action(args: ActionFunctionArgs) {
  const user = await getClerkUser(args)
  
  if (!user) {
    return json({ error: "Debes iniciar sesión" }, { status: 401 })
  }
  
  // Only allow admin and superadmin to edit their profiles
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 })
  }
  
  const formData = await args.request.formData()
  const intent = formData.get("intent") as string
  
  try {
    switch (intent) {
      case "update-profile": {
        const name = formData.get("name") as string
        const phone = formData.get("phone") as string
        
        if (!name || name.trim().length < 2) {
          return json({ error: "El nombre debe tener al menos 2 caracteres" }, { status: 400 })
        }
        
        if (!phone || phone.trim().length < 10) {
          return json({ error: "El teléfono debe tener al menos 10 dígitos" }, { status: 400 })
        }
        
        const success = await UserModel.updateProfile(user._id!.toString(), {
          name: name.trim(),
          phone: phone.trim()
        })
        
        if (!success) {
          return json({ error: "Error al actualizar el perfil" }, { status: 500 })
        }
        
        return json({ success: true, message: "Perfil actualizado exitosamente" })
      }
      
      case "change-password": {
        const currentPassword = formData.get("currentPassword") as string
        const newPassword = formData.get("newPassword") as string
        const confirmPassword = formData.get("confirmPassword") as string
        
        if (!currentPassword || !newPassword || !confirmPassword) {
          return json({ error: "Todos los campos de contraseña son requeridos" }, { status: 400 })
        }
        
        if (newPassword !== confirmPassword) {
          return json({ error: "Las contraseñas nuevas no coinciden" }, { status: 400 })
        }
        
        if (newPassword.length < 6) {
          return json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
        }
        
        // Verify current password
        const isValidPassword = await UserModel.verifyPassword(user, currentPassword)
        if (!isValidPassword) {
          return json({ error: "La contraseña actual es incorrecta" }, { status: 400 })
        }
        
        const success = await UserModel.changePassword(user._id!.toString(), newPassword)
        if (!success) {
          return json({ error: "Error al cambiar la contraseña" }, { status: 500 })
        }
        
        return json({ success: true, message: "Contraseña cambiada exitosamente" })
      }
      
      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error en action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export default function ProfileEdit() {
  const { user } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  
  const isSubmitting = navigation.state === "submitting"
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to={user.role === 'superadmin' ? "/admin" : "/"}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-light text-gray-900">
                Editar Perfil
              </h1>
              <p className="text-gray-600">
                Actualiza tu información personal y contraseña
              </p>
            </div>
          </div>
        </div>
        
        {/* Success/Error Messages */}
        {actionData && 'success' in actionData && actionData.success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{actionData.message}</p>
            </div>
          </div>
        )}
        
        {actionData && 'error' in actionData && actionData.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{actionData.error}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Información Personal
            </h2>
            
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="update-profile" />
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    defaultValue={user.name}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    placeholder="tu@email.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  El email no se puede cambiar
                </p>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={user.phone || ""}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tu número de teléfono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                    user.role === 'superadmin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'superadmin' ? 'Super Administrador' : 'Administrador'}
                  </span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </Form>
          </div>
          
          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-6 flex items-center gap-2">
              <KeyIcon className="w-5 h-5" />
              Cambiar Contraseña
            </h2>
            
            <Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="change-password" />
              
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu contraseña actual"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nueva contraseña (mínimo 6 caracteres)"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  )
}