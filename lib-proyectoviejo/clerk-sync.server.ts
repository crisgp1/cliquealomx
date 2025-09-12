import { ClerkRoles } from './clerk-roles.server'
import { UserModel } from '~/models/User.server'

/**
 * Middleware para sincronizar usuarios de Clerk con la base de datos
 */
export async function syncClerkUserOnAuth(clerkUserId: string) {
  try {
    // Intentar obtener o crear el usuario
    const user = await ClerkRoles.getOrCreateUser(clerkUserId)
    
    if (user) {
      console.log(`✅ Usuario sincronizado: ${user.name} (${user.email})`)
      return user
    } else {
      console.log(`❌ Error sincronizando usuario con ID: ${clerkUserId}`)
      return null
    }
  } catch (error) {
    console.error('Error en syncClerkUserOnAuth:', error)
    return null
  }
}

/**
 * Función para verificar y sincronizar usuario en cada request autenticado
 */
export async function ensureUserSynced(clerkUserId: string) {
  // Buscar usuario existente
  let user = await UserModel.findByClerkId(clerkUserId)
  
  if (!user) {
    // Si no existe, crear automáticamente usando ClerkRoles que respeta el metadata
    console.log(`🔄 Creando usuario automáticamente para Clerk ID: ${clerkUserId}`)
    const createdUser = await ClerkRoles.getOrCreateUser(clerkUserId)
    
    if (!createdUser) {
      console.error(`❌ Error: No se pudo crear/obtener usuario para Clerk ID: ${clerkUserId}`)
      return null
    }
    
    // Buscar el usuario recién creado para obtener el tipo correcto con _id
    user = await UserModel.findByClerkId(clerkUserId)
    
    if (!user) {
      console.error(`❌ Error: Usuario creado pero no encontrado en DB para Clerk ID: ${clerkUserId}`)
      return null
    }
    
    console.log(`✅ Usuario creado/sincronizado: ${user.name} con rol ${user.role}`)
  }
  
  return user
}