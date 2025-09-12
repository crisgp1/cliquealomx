import { ObjectId } from 'mongodb'
import { db } from '~/lib/db.server'
import bcrypt from 'bcryptjs'

export interface User {
  _id?: ObjectId
  name: string
  email: string
  username: string // Added username field
  passwordHash: string
  role: 'user' | 'admin' | 'superadmin'
  likedListings: ObjectId[] // autos a los que dio like
  createdAt: Date
  updatedAt?: Date
  isActive: boolean
  avatar?: string
  phone?: string
  lastLogin?: Date
  clerkId?: string // Clerk user ID
}

export const UserModel = {
  // Crear usuario
  async create(userData: { 
    name: string, 
    email: string, 
    phone: string, 
    password: string, 
    role?: User['role'] 
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    // Generate a username from the email (before the @ symbol)
    const emailUsername = userData.email.toLowerCase().trim().split('@')[0]
    // Add a random suffix to ensure uniqueness
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const username = `${emailUsername}_${randomSuffix}`
    
    const user = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone.trim(),
      username: username, // Set the unique username
      passwordHash: hashedPassword,
      role: userData.role || 'user' as User['role'],
      likedListings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
    
    const result = await db.collection<User>('users').insertOne(user)
    return { ...user, _id: result.insertedId }
  },

  // Buscar por email
  async findByEmail(email: string) {
    return await db.collection<User>('users').findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    })
  },

  // Buscar por teléfono
  async findByPhone(phone: string) {
    return await db.collection<User>('users').findOne({ 
      phone: phone.trim(),
      isActive: true 
    })
  },

  // Buscar por ID
  async findById(id: string) {
    return await db.collection<User>('users').findOne({
      _id: new ObjectId(id),
      isActive: true
    })
  },

  // Buscar por ID para admin (incluye usuarios inactivos)
  async findByIdForAdmin(id: string) {
    return await db.collection<User>('users').findOne({
      _id: new ObjectId(id)
    })
  },

  // Buscar por Clerk ID
  async findByClerkId(clerkId: string) {
    return await db.collection<User>('users').findOne({
      clerkId: clerkId,
      isActive: true
    })
  },

  // Crear usuario desde Clerk
  async createFromClerk(clerkUser: {
    id: string,
    firstName?: string,
    lastName?: string,
    emailAddresses: Array<{ emailAddress: string }>,
    phoneNumbers?: Array<{ phoneNumber: string }>,
    imageUrl?: string
  }) {
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) throw new Error('Email requerido')

    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Usuario'
    const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || ''
    
    // Generate username from email
    const emailUsername = email.toLowerCase().trim().split('@')[0]
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const username = `${emailUsername}_${randomSuffix}`
    
    const user = {
      name,
      email: email.toLowerCase().trim(),
      phone,
      username,
      passwordHash: '', // No password needed for Clerk users
      role: 'user' as User['role'], // Default role
      likedListings: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      avatar: clerkUser.imageUrl,
      clerkId: clerkUser.id
    }
    
    const result = await db.collection<User>('users').insertOne(user)
    return { ...user, _id: result.insertedId }
  },

  // Sincronizar rol con Clerk metadata
  async syncRoleWithClerk(userId: string, role: User['role']) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role,
          updatedAt: new Date()
        }
      }
    )
    return result.modifiedCount > 0
  },

  // Verificar contraseña
  async verifyPassword(user: User, password: string) {
    return await bcrypt.compare(password, user.passwordHash)
  },

  // Actualizar último login
  async updateLastLogin(userId: string) {
    await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        } 
      }
    )
  },

  // Verificar si es admin
  async isAdmin(userId: string) {
    const user = await this.findById(userId)
    return user && (user.role === 'admin' || user.role === 'superadmin')
  },

  // Verificar si es superadmin
  async isSuperAdmin(userId: string) {
    const user = await this.findById(userId)
    return user && user.role === 'superadmin'
  },

  // Verificar permisos para crear listings
  async canCreateListings(userId: string) {
    const user = await this.findById(userId)
    return user && (user.role === 'admin' || user.role === 'superadmin')
  },

  // Verificar permisos para gestionar usuarios
  async canManageUsers(userId: string) {
    const user = await this.findById(userId)
    return user && user.role === 'superadmin'
  },

  // Promover usuario a admin (solo superadmin)
  async promoteToAdmin(userId: string) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          role: 'admin',
          updatedAt: new Date()
        } 
      }
    )
    return result.modifiedCount > 0
  },

  // Degradar admin a usuario
  async demoteToUser(userId: string) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          role: 'user',
          updatedAt: new Date()
        } 
      }
    )
    return result.modifiedCount > 0
  },

  // Desactivar usuario
  async deactivateUser(userId: string) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        } 
      }
    )
    return result.modifiedCount > 0
  },

  // Reactivar usuario
  async reactivateUser(userId: string) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          isActive: true,
          updatedAt: new Date()
        } 
      }
    )
    return result.modifiedCount > 0
  },

  // Dar like a un listing
  async likeListing(userId: string, listingId: string) {
    // Verificar que el usuario no sea el dueño del listing
    const listing = await db.collection('listings').findOne({ 
      _id: new ObjectId(listingId) 
    })
    
    if (listing && listing.user.toString() === userId) {
      return false // No puede dar like a su propio listing
    }

    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $addToSet: { likedListings: new ObjectId(listingId) },
        $set: { updatedAt: new Date() }
      }
    )
    
    // Incrementar contador en el listing
    if (result.modifiedCount > 0) {
      await db.collection('listings').updateOne(
        { _id: new ObjectId(listingId) },
        { 
          $inc: { likesCount: 1 },
          $set: { updatedAt: new Date() }
        }
      )
    }
    
    return result.modifiedCount > 0
  },

  // Quitar like a un listing
  async unlikeListing(userId: string, listingId: string) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { likedListings: new ObjectId(listingId) },
        $set: { updatedAt: new Date() }
      }
    )
    
    // Decrementar contador en el listing
    if (result.modifiedCount > 0) {
      await db.collection('listings').updateOne(
        { _id: new ObjectId(listingId) },
        { 
          $inc: { likesCount: -1 },
          $set: { updatedAt: new Date() }
        }
      )
    }
    
    return result.modifiedCount > 0
  },

  // Obtener listings que le gustan al usuario
  async getLikedListings(userId: string, limit = 20, skip = 0) {
    const result = await db.collection<User>('users').aggregate([
      { $match: { _id: new ObjectId(userId) } },
      { $unwind: '$likedListings' },
      {
        $lookup: {
          from: 'listings',
          localField: 'likedListings',
          foreignField: '_id',
          as: 'listing'
        }
      },
      { $unwind: '$listing' },
      {
        $lookup: {
          from: 'users',
          localField: 'listing.user',
          foreignField: '_id',
          as: 'listing.owner',
          pipeline: [{ $project: { passwordHash: 0 } }]
        }
      },
      { $unwind: '$listing.owner' },
      { $replaceRoot: { newRoot: '$listing' } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()
    
    return result
  },

  // Verificar si un usuario le dio like a un listing
  async hasLiked(userId: string, listingId: string) {
    const user = await db.collection<User>('users').findOne(
      { 
        _id: new ObjectId(userId),
        likedListings: new ObjectId(listingId)
      },
      { projection: { _id: 1 } }
    )
    return !!user
  },

  // Actualizar perfil de usuario
  async updateProfile(id: string, updateData: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>) {
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date()
        } 
      }
    )
    return result.modifiedCount > 0
  },

  // Cambiar contraseña
  async changePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const result = await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        } 
      }
    )
    return result.modifiedCount > 0
  },

  // Listar usuarios con filtros (para admin)
  async findAll(filters: {
    role?: User['role']
    search?: string
    isActive?: boolean
    limit?: number
    skip?: number
  } = {}) {
    const {
      role,
      search,
      isActive = true,
      limit = 50,
      skip = 0
    } = filters

    const query: any = { isActive }

    if (role) {
      query.role = role
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    return await db.collection<User>('users')
      .find(query, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray()
  },

  // Estadísticas de usuarios
  async getStats() {
    const pipeline = [
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]

    const roleStats = await db.collection<User>('users').aggregate(pipeline).toArray()
    
    const total = await db.collection<User>('users').countDocuments({ isActive: true })
    const totalInactive = await db.collection<User>('users').countDocuments({ isActive: false })

    return {
      total,
      totalInactive,
      byRole: roleStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count
        return acc
      }, {} as Record<string, number>)
    }
  }
}