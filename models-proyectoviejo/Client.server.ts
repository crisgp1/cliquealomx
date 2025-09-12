import { ObjectId } from 'mongodb';
import { db } from '~/lib/db.server';

export interface Client {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  rfc?: string;
  address?: string;
  idNumber?: string;
  contractType: 'compraventa' | 'apartado' | 'consignacion';
  vehicleInfo: {
    brand: string;
    model: string;
    year: string;
    color?: string;
    motor?: string;
    series?: string;
    plates?: string;
    type?: string;
    circulation?: string;
    invoice?: string;
    refrendos?: string;
  };
  contractData: {
    totalAmount: string;
    paymentMethod: string;
    date: string;
    time: string;
    city: string;
    observations?: string;
  };
  documents: {
    signedContract: string[];
    identification: string[];
    vehicleDocuments: string[];
    other: string[];
  };
  listingId?: ObjectId;
  listingStatus: 'sold' | 'reserved' | 'active';
  notes?: string;
  contractNumber: string; // Número único del contrato
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  createdBy?: ObjectId; // Admin who created the client
}

// Generate unique contract number
function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `CX-${year}${month}${day}-${random}`;
}

export const ClientModel = {
  // Create client
  async create(clientData: Omit<Client, '_id' | 'createdAt' | 'updatedAt' | 'isActive'>) {
    const client = {
      ...clientData,
      // Use provided contractNumber or generate one if not provided
      contractNumber: clientData.contractNumber || generateContractNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    
    const result = await db.collection<Client>('clients').insertOne(client);
    return { ...client, _id: result.insertedId };
  },

  // Find client by ID
  async findById(id: string) {
    return await db.collection<Client>('clients').findOne({
      _id: new ObjectId(id),
      isActive: true
    });
  },

  // Find client by email
  async findByEmail(email: string) {
    return await db.collection<Client>('clients').findOne({
      email: email.toLowerCase().trim(),
      isActive: true
    });
  },

  // Find client by phone
  async findByPhone(phone: string) {
    return await db.collection<Client>('clients').findOne({
      phone: phone.trim(),
      isActive: true
    });
  },

  // Find clients by listing ID
  async findByListingId(listingId: string) {
    return await db.collection<Client>('clients').find({
      listingId: new ObjectId(listingId),
      isActive: true
    }).toArray();
  },

  // Update client
  async update(id: string, updateData: Partial<Client>) {
    const result = await db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  },

  // Deactivate client
  async deactivate(id: string) {
    const result = await db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  },

  // List clients with filters
  async findMany(filters: {
    contractType?: Client['contractType'];
    listingStatus?: Client['listingStatus'];
    search?: string;
    createdBy?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    skip?: number;
  } = {}) {
    const {
      contractType,
      listingStatus,
      search,
      createdBy,
      dateFrom,
      dateTo,
      limit = 50,
      skip = 0
    } = filters;

    const query: any = { isActive: true };

    if (contractType) {
      query.contractType = contractType;
    }

    if (listingStatus) {
      query.listingStatus = listingStatus;
    }

    if (createdBy) {
      query.createdBy = new ObjectId(createdBy);
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { rfc: { $regex: search, $options: 'i' } },
        { contractNumber: { $regex: search, $options: 'i' } },
        { 'vehicleInfo.brand': { $regex: search, $options: 'i' } },
        { 'vehicleInfo.model': { $regex: search, $options: 'i' } },
        { 'vehicleInfo.plates': { $regex: search, $options: 'i' } }
      ];
    }

    return await db.collection<Client>('clients')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
  },

  // Get client statistics
  async getStats() {
    const pipeline = [
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          compraventas: {
            $sum: { $cond: [{ $eq: ['$contractType', 'compraventa'] }, 1, 0] }
          },
          apartados: {
            $sum: { $cond: [{ $eq: ['$contractType', 'apartado'] }, 1, 0] }
          },
          consignaciones: {
            $sum: { $cond: [{ $eq: ['$contractType', 'consignacion'] }, 1, 0] }
          },
          sold: {
            $sum: { $cond: [{ $eq: ['$listingStatus', 'sold'] }, 1, 0] }
          },
          reserved: {
            $sum: { $cond: [{ $eq: ['$listingStatus', 'reserved'] }, 1, 0] }
          }
        }
      }
    ];

    const result = await db.collection<Client>('clients').aggregate(pipeline).toArray();
    return result[0] || {
      totalClients: 0,
      compraventas: 0,
      apartados: 0,
      consignaciones: 0,
      sold: 0,
      reserved: 0
    };
  },

  // Get recent clients
  async getRecent(limit = 10) {
    return await db.collection<Client>('clients')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
};