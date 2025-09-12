import { ObjectId } from 'mongodb'
import { db } from '~/lib/db.server'

export interface BankPartnerIncident {
  _id?: ObjectId
  type: 'tardanza' | 'no_respuesta' | 'mala_atencion' | 'documentos_faltantes' | 'proceso_lento' | 'otro'
  description: string
  severity: 'baja' | 'media' | 'alta' | 'critica'
  reportedBy: ObjectId // Admin que reportó
  reportedAt: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: ObjectId
  notes?: string
}

export interface BankPartner {
  _id?: ObjectId
  name: string
  logo?: string
  creditRate: number // Tasa de interés anual (EDITABLE)
  minTerm: number // Plazo mínimo en meses (FIJO)
  maxTerm: number // Plazo máximo en meses (FIJO)
  minVehicleYear?: number // Año mínimo del vehículo que financia (EDITABLE)
  requirements: string[] // Requisitos específicos del banco (FIJO)
  processingTime: number // Tiempo de procesamiento en días (FIJO)
  isActive: boolean
  contactInfo?: {
    phone?: string
    email?: string
    website?: string
  }
  incidents: BankPartnerIncident[] // Array de incidencias
  incidentStats?: {
    total: number
    unresolved: number
    lastIncident?: Date
  }
  createdAt: Date
  updatedAt: Date
  createdBy: ObjectId // Admin que lo creó
}

export const BankPartnerModel = {
  // Crear nuevo aliado bancario
  async create(partnerData: Omit<BankPartner, '_id' | 'createdAt' | 'updatedAt'>) {
    const partner = {
      ...partnerData,
      createdBy: new ObjectId(partnerData.createdBy),
      incidents: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection<BankPartner>('bank_partners').insertOne(partner)
    return { ...partner, _id: result.insertedId }
  },

  // Buscar por ID
  async findById(id: string) {
    return await db.collection<BankPartner>('bank_partners').findOne({ 
      _id: new ObjectId(id) 
    })
  },

  // Listar todos los aliados bancarios
  async findAll(filters: {
    isActive?: boolean
    search?: string
    limit?: number
    skip?: number
  } = {}) {
    const {
      isActive,
      search,
      limit = 50,
      skip = 0
    } = filters

    const query: any = {}

    if (typeof isActive === 'boolean') {
      query.isActive = isActive
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ]
    }

    return await db.collection<BankPartner>('bank_partners').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator',
          pipeline: [{ $project: { passwordHash: 0 } }]
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()
  },

  // Obtener aliados bancarios activos para el simulador
  async findActiveForSimulator() {
    return await db.collection<BankPartner>('bank_partners').find({ 
      isActive: true 
    }).sort({ creditRate: 1 }).toArray() // Ordenar por tasa más baja primero
  },

  // Obtener aliados bancarios activos que financian un vehículo del año especificado
  async findActiveForVehicleYear(vehicleYear: number) {
    return await db.collection<BankPartner>('bank_partners').find({ 
      isActive: true,
      $or: [
        { minVehicleYear: { $exists: false } }, // Si no tiene restricción de año
        { minVehicleYear: { $lte: vehicleYear } } // Si el año del vehículo es mayor o igual al mínimo
      ]
    }).sort({ creditRate: 1 }).toArray()
  },

  // Actualizar aliado bancario (solo tasa de interés, año mínimo y estado activo)
  async update(id: string, updateData: { creditRate?: number; minVehicleYear?: number; isActive?: boolean }) {
    const result = await db.collection<BankPartner>('bank_partners').updateOne(
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

  // Actualizar solo la tasa de interés
  async updateCreditRate(id: string, creditRate: number) {
    const result = await db.collection<BankPartner>('bank_partners').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          creditRate,
          updatedAt: new Date()
        }
      }
    )
    return result.modifiedCount > 0
  },

  // Actualizar solo el año mínimo del vehículo
  async updateMinVehicleYear(id: string, minVehicleYear: number | null) {
    const result = await db.collection<BankPartner>('bank_partners').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          minVehicleYear,
          updatedAt: new Date()
        }
      }
    )
    return result.modifiedCount > 0
  },

  // Cambiar estado activo/inactivo
  async toggleActive(id: string) {
    const partner = await this.findById(id)
    if (!partner) return false

    const result = await db.collection<BankPartner>('bank_partners').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: !partner.isActive,
          updatedAt: new Date()
        }
      }
    )
    return result.modifiedCount > 0
  },

  // Eliminar aliado bancario
  async delete(id: string) {
    const result = await db.collection<BankPartner>('bank_partners').deleteOne({ 
      _id: new ObjectId(id) 
    })
    return result.deletedCount > 0
  },

  // Obtener estadísticas
  async getStats() {
    const pipeline = [
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgRate: { $avg: '$creditRate' },
          minRate: { $min: '$creditRate' },
          maxRate: { $max: '$creditRate' }
        }
      }
    ]

    const result = await db.collection<BankPartner>('bank_partners').aggregate(pipeline).toArray()
    return result[0] || {
      total: 0,
      active: 0,
      avgRate: 0,
      minRate: 0,
      maxRate: 0
    }
  },

  // Buscar el mejor aliado para un monto y plazo específico
  async findBestMatch(amount: number, term: number, vehicleYear?: number) {
    const query: any = {
      isActive: true,
      minTerm: { $lte: term },
      maxTerm: { $gte: term }
    }

    // Si se proporciona el año del vehículo, filtrar por eso también
    if (vehicleYear) {
      query.$and = [
        {
          $or: [
            { minVehicleYear: { $exists: false } },
            { minVehicleYear: { $lte: vehicleYear } }
          ]
        }
      ]
    }

    return await db.collection<BankPartner>('bank_partners').find(query)
      .sort({ creditRate: 1 }).limit(3).toArray() // Top 3 mejores opciones
  },

  // Reportar una incidencia
  async reportIncident(
    bankPartnerId: string, 
    incidentData: {
      type: BankPartnerIncident['type']
      description: string
      severity: BankPartnerIncident['severity']
      reportedBy: ObjectId
    }
  ) {
    const incident: BankPartnerIncident = {
      _id: new ObjectId(),
      ...incidentData,
      reportedAt: new Date(),
      resolved: false
    }

    const result = await db.collection<BankPartner>('bank_partners').updateOne(
      { _id: new ObjectId(bankPartnerId) },
      {
        $push: { incidents: incident },
        $set: { updatedAt: new Date() }
      }
    )
    return result.modifiedCount > 0
  },

  // Resolver una incidencia
  async resolveIncident(
    bankPartnerId: string,
    incidentId: string,
    resolvedBy: ObjectId,
    notes?: string
  ) {
    const result = await db.collection<BankPartner>('bank_partners').updateOne(
      { 
        _id: new ObjectId(bankPartnerId),
        'incidents._id': new ObjectId(incidentId)
      },
      {
        $set: {
          'incidents.$.resolved': true,
          'incidents.$.resolvedAt': new Date(),
          'incidents.$.resolvedBy': resolvedBy,
          'incidents.$.notes': notes,
          updatedAt: new Date()
        }
      }
    )
    return result.modifiedCount > 0
  },

  // Obtener incidencias de un banco
  async getIncidents(bankPartnerId: string, filters: {
    resolved?: boolean
    type?: BankPartnerIncident['type']
    severity?: BankPartnerIncident['severity']
    limit?: number
  } = {}) {
    const partner = await this.findById(bankPartnerId)
    if (!partner || !partner.incidents) return []

    let incidents = [...partner.incidents]

    // Aplicar filtros
    if (typeof filters.resolved === 'boolean') {
      incidents = incidents.filter(i => i.resolved === filters.resolved)
    }
    if (filters.type) {
      incidents = incidents.filter(i => i.type === filters.type)
    }
    if (filters.severity) {
      incidents = incidents.filter(i => i.severity === filters.severity)
    }

    // Ordenar por fecha más reciente
    incidents.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())

    // Limitar resultados
    if (filters.limit) {
      incidents = incidents.slice(0, filters.limit)
    }

    return incidents
  },

  // Obtener estadísticas de incidencias para todos los bancos
  async getIncidentStats() {
    const partners = await this.findAll()
    
    return partners.map((partner: any) => {
      const incidents = partner.incidents || []
      const unresolved = incidents.filter((i: BankPartnerIncident) => !i.resolved)
      const lastIncident = incidents.length > 0 
        ? incidents.sort((a: BankPartnerIncident, b: BankPartnerIncident) => 
            new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
          )[0]
        : null

      return {
        bankId: partner._id,
        bankName: partner.name,
        total: incidents.length,
        unresolved: unresolved.length,
        lastIncident: lastIncident ? lastIncident.reportedAt : null,
        severityBreakdown: {
          critica: incidents.filter((i: BankPartnerIncident) => i.severity === 'critica').length,
          alta: incidents.filter((i: BankPartnerIncident) => i.severity === 'alta').length,
          media: incidents.filter((i: BankPartnerIncident) => i.severity === 'media').length,
          baja: incidents.filter((i: BankPartnerIncident) => i.severity === 'baja').length,
        }
      }
    })
  }
}