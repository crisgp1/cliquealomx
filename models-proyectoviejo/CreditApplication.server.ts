import { ObjectId } from 'mongodb'
import { db } from '~/lib/db.server'

export interface DocumentFile {
  id: string
  url: string
  type: 'identification' | 'income_proof' | 'address_proof' | 'bank_statement' | 'other'
  name: string
  size: number
  uploadedAt: Date
}

export interface CreditApplication {
  _id?: ObjectId
  userId: ObjectId // usuario que solicita el crédito
  listingId?: ObjectId // auto al que aplica (opcional)
  
  // Información personal
  personalInfo: {
    fullName: string
    email: string
    phone: string
    dateOfBirth: Date
    curp: string
    rfc?: string
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed'
    dependents: number
  }
  
  // Información laboral
  employmentInfo: {
    employmentType: 'employee' | 'self_employed' | 'business_owner' | 'retired' | 'unemployed'
    companyName?: string
    position?: string
    monthlyIncome: number
    workExperience: number // años
    workAddress?: string
    workPhone?: string
  }
  
  // Información financiera
  financialInfo: {
    requestedAmount: number
    downPayment: number
    preferredTerm: number // meses
    monthlyExpenses: number
    otherDebts: number
    bankName: string
    accountType: 'checking' | 'savings'
  }
  
  // Información de contacto de emergencia
  emergencyContact: {
    name: string
    relationship: string
    phone: string
    address?: string
  }
  
  // Documentos subidos
  documents: DocumentFile[]
  
  // Estado de la solicitud
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled'
  
  // Información de revisión
  reviewInfo?: {
    reviewedBy: ObjectId // admin que revisó
    reviewedAt: Date
    approvedAmount?: number
    approvedTerm?: number
    interestRate?: number
    monthlyPayment?: number
    comments?: string
    rejectionReason?: string
  }
  
  // Metadatos
  createdAt: Date
  updatedAt: Date
  submittedAt?: Date
}

export const CreditApplicationModel = {
  // Crear nueva solicitud
  async create(applicationData: Omit<CreditApplication, '_id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const application = {
      ...applicationData,
      userId: new ObjectId(applicationData.userId),
      listingId: applicationData.listingId ? new ObjectId(applicationData.listingId) : undefined,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection<CreditApplication>('credit_applications').insertOne(application)
    return { ...application, _id: result.insertedId }
  },

  // Crear nueva solicitud usando Clerk ID
  async createWithClerkId(applicationData: Omit<CreditApplication, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'userId'> & { clerkId: string }) {
    // Buscar el usuario por Clerk ID para obtener su ObjectId
    const user = await db.collection('users').findOne({ clerkId: applicationData.clerkId })
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    const application = {
      ...applicationData,
      userId: user._id,
      listingId: applicationData.listingId ? new ObjectId(applicationData.listingId) : undefined,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Remover clerkId del objeto antes de insertar
    const { clerkId, ...applicationToInsert } = application
    
    const result = await db.collection<CreditApplication>('credit_applications').insertOne(applicationToInsert)
    return { ...applicationToInsert, _id: result.insertedId }
  },

  // Buscar por ID
  async findById(id: string) {
    return await db.collection<CreditApplication>('credit_applications').findOne({ 
      _id: new ObjectId(id) 
    })
  },

  // Buscar por ID con información del usuario y listing
  async findByIdWithDetails(id: string) {
    const result = await db.collection<CreditApplication>('credit_applications').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { passwordHash: 0 } }]
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'reviewInfo.reviewedBy',
          foreignField: '_id',
          as: 'reviewer',
          pipeline: [{ $project: { passwordHash: 0 } }]
        }
      }
    ]).toArray()
    
    return result[0] || null
  },

  // Buscar solicitudes por usuario (usando MongoDB ObjectId)
  async findByUserId(userId: string, limit = 20, skip = 0) {
    return await db.collection<CreditApplication>('credit_applications').aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()
  },

  // Buscar solicitudes por Clerk ID
  async findByClerkId(clerkId: string, limit = 20, skip = 0) {
    return await db.collection<CreditApplication>('credit_applications').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.clerkId': clerkId } },
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          user: 0 // No incluir datos del usuario en el resultado
        }
      }
    ]).toArray()
  },

  // Listar todas las solicitudes (para admin)
  async findAll(filters: {
    status?: CreditApplication['status']
    search?: string
    dateFrom?: Date
    dateTo?: Date
    limit?: number
    skip?: number
  } = {}) {
    const {
      status,
      search,
      dateFrom,
      dateTo,
      limit = 50,
      skip = 0
    } = filters

    const query: any = {}

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.phone': { $regex: search, $options: 'i' } },
        { 'personalInfo.curp': { $regex: search, $options: 'i' } }
      ]
    }

    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) query.createdAt.$gte = dateFrom
      if (dateTo) query.createdAt.$lte = dateTo
    }

    return await db.collection<CreditApplication>('credit_applications').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { passwordHash: 0 } }]
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'listings',
          localField: 'listingId',
          foreignField: '_id',
          as: 'listing'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'reviewInfo.reviewedBy',
          foreignField: '_id',
          as: 'reviewer',
          pipeline: [{ $project: { passwordHash: 0 } }]
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()
  },

  // Actualizar solicitud
  async update(id: string, updateData: Partial<Omit<CreditApplication, '_id' | 'userId' | 'createdAt'>>) {
    const result = await db.collection<CreditApplication>('credit_applications').updateOne(
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

  // Cambiar estado de la solicitud
  async updateStatus(id: string, status: CreditApplication['status'], reviewInfo?: CreditApplication['reviewInfo']) {
    const updateData: any = { 
      status,
      updatedAt: new Date()
    }
    
    if (status === 'under_review' && !reviewInfo) {
      updateData.submittedAt = new Date()
    }
    
    if (reviewInfo) {
      updateData.reviewInfo = {
        ...reviewInfo,
        reviewedBy: new ObjectId(reviewInfo.reviewedBy),
        reviewedAt: new Date()
      }
    }

    const result = await db.collection<CreditApplication>('credit_applications').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    return result.modifiedCount > 0
  },

  // Agregar documento
  async addDocument(id: string, document: DocumentFile) {
    const result = await db.collection<CreditApplication>('credit_applications').updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { documents: document },
        $set: { updatedAt: new Date() }
      }
    )
    return result.modifiedCount > 0
  },

  // Remover documento
  async removeDocument(id: string, documentId: string) {
    const result = await db.collection<CreditApplication>('credit_applications').updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { documents: { id: documentId } },
        $set: { updatedAt: new Date() }
      }
    )
    return result.modifiedCount > 0
  },

  // Verificar si el usuario es dueño de la solicitud
  async isOwner(applicationId: string, userId: string) {
    const application = await db.collection<CreditApplication>('credit_applications').findOne(
      { 
        _id: new ObjectId(applicationId),
        userId: new ObjectId(userId)
      },
      { projection: { _id: 1 } }
    )
    return !!application
  },

  // Estadísticas para admin
  async getStats() {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgRequestedAmount: { $avg: '$financialInfo.requestedAmount' },
          totalRequestedAmount: { $sum: '$financialInfo.requestedAmount' }
        }
      }
    ]

    const statusStats = await db.collection<CreditApplication>('credit_applications').aggregate(pipeline).toArray()
    const total = await db.collection<CreditApplication>('credit_applications').countDocuments()
    const recentCount = await db.collection<CreditApplication>('credit_applications').countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // últimos 30 días
    })

    return {
      total,
      recentCount,
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgRequestedAmount: stat.avgRequestedAmount,
          totalRequestedAmount: stat.totalRequestedAmount
        }
        return acc
      }, {} as Record<string, any>)
    }
  },

  // Eliminar solicitud
  async delete(id: string) {
    const result = await db.collection<CreditApplication>('credit_applications').deleteOne({ 
      _id: new ObjectId(id) 
    })
    return result.deletedCount > 0
  }
}