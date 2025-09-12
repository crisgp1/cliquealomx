import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BankPartner } from '@domain/entities/bank-partner.entity';
import { 
  BankPartnerRepository, 
  BankPartnerFilters,
  BestMatchFilters 
} from '@domain/repositories/bank-partner.repository';
import { 
  BankPartnerSchema, 
  BankPartnerDocument 
} from '@infrastructure/persistence/schemas/bank-partner.schema';

@Injectable()
export class MongooseBankPartnerRepository implements BankPartnerRepository {
  constructor(
    @InjectModel(BankPartnerSchema.name) 
    private bankPartnerModel: Model<BankPartnerDocument>
  ) {}

  async create(bankPartner: BankPartner): Promise<BankPartner> {
    const createdBankPartner = new this.bankPartnerModel(bankPartner);
    const saved = await createdBankPartner.save();
    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<BankPartner | null> {
    const bankPartner = await this.bankPartnerModel.findById(id).exec();
    return bankPartner ? this.mapToEntity(bankPartner) : null;
  }

  async findAll(filters: BankPartnerFilters = {}): Promise<BankPartner[]> {
    const {
      isActive,
      search,
      limit = 50,
      skip = 0
    } = filters;

    const query: any = {};

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const bankPartners = await this.bankPartnerModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return bankPartners.map(bp => this.mapToEntity(bp));
  }

  async findActiveForSimulator(): Promise<BankPartner[]> {
    const bankPartners = await this.bankPartnerModel
      .find({ isActive: true })
      .sort({ creditRate: 1 }) // Ordenar por tasa más baja primero
      .exec();

    return bankPartners.map(bp => this.mapToEntity(bp));
  }

  async findActiveForVehicleYear(vehicleYear: number): Promise<BankPartner[]> {
    const bankPartners = await this.bankPartnerModel
      .find({
        isActive: true,
        $or: [
          { minVehicleYear: { $exists: false } }, // Sin restricción de año
          { minVehicleYear: { $lte: vehicleYear } } // Año válido
        ]
      })
      .sort({ creditRate: 1 })
      .exec();

    return bankPartners.map(bp => this.mapToEntity(bp));
  }

  async findBestMatch(filters: BestMatchFilters): Promise<BankPartner[]> {
    const { amount, term, vehicleYear } = filters;
    
    const query: any = {
      isActive: true,
      minTerm: { $lte: term },
      maxTerm: { $gte: term }
    };

    // Si se proporciona el año del vehículo, filtrar por eso también
    if (vehicleYear) {
      query.$or = [
        { minVehicleYear: { $exists: false } },
        { minVehicleYear: { $lte: vehicleYear } }
      ];
    }

    const bankPartners = await this.bankPartnerModel
      .find(query)
      .sort({ creditRate: 1 }) // Mejores tasas primero
      .limit(3) // Top 3 mejores opciones
      .exec();

    return bankPartners.map(bp => this.mapToEntity(bp));
  }

  async update(id: string, updateData: Partial<BankPartner>): Promise<boolean> {
    const result = await this.bankPartnerModel
      .updateOne(
        { _id: id }, 
        { $set: { ...updateData, updatedAt: new Date() } }
      )
      .exec();

    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.bankPartnerModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async getStats(): Promise<any> {
    const result = await this.bankPartnerModel.aggregate([
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
    ]).exec();

    return result[0] || {
      total: 0,
      active: 0,
      avgRate: 0,
      minRate: 0,
      maxRate: 0
    };
  }

  async getIncidentStats(): Promise<any[]> {
    const bankPartners = await this.bankPartnerModel.find().exec();
    
    return bankPartners.map(partner => {
      const incidents = partner.incidents || [];
      const unresolved = incidents.filter(i => !i.resolved);
      const lastIncident = incidents.length > 0 
        ? incidents.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())[0]
        : null;

      return {
        bankId: partner._id.toString(),
        bankName: partner.name,
        total: incidents.length,
        unresolved: unresolved.length,
        lastIncident: lastIncident ? lastIncident.reportedAt : null,
        severityBreakdown: {
          critica: incidents.filter(i => i.severity === 'critica').length,
          alta: incidents.filter(i => i.severity === 'alta').length,
          media: incidents.filter(i => i.severity === 'media').length,
          baja: incidents.filter(i => i.severity === 'baja').length,
        }
      };
    });
  }

  private mapToEntity(document: BankPartnerDocument): BankPartner {
    return new BankPartner(
      document._id.toString(),
      document.name,
      document.creditRate,
      document.minTerm,
      document.maxTerm,
      document.requirements,
      document.processingTime,
      document.isActive,
      document.createdBy,
      document.createdAt,
      document.updatedAt,
      document.logo,
      document.minVehicleYear,
      document.contactInfo,
      document.incidents || [],
      document.incidentStats
    );
  }
}