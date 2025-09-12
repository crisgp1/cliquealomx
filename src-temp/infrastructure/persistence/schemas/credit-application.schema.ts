import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { 
  PersonalInfo, 
  EmploymentInfo, 
  FinancialInfo, 
  EmergencyContact, 
  DocumentFile, 
  ReviewInfo 
} from '@domain/entities/credit-application.entity';

export type CreditApplicationDocument = CreditApplicationSchema & Document;

@Schema({
  timestamps: true,
  collection: 'credit_applications'
})
export class CreditApplicationSchema {
  @Prop({ required: true })
  userId: string; // Clerk ID

  @Prop()
  listingId?: string;

  @Prop({
    type: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      dateOfBirth: { type: Date, required: true },
      curp: { type: String, required: true },
      rfc: String,
      maritalStatus: { 
        type: String, 
        enum: ['single', 'married', 'divorced', 'widowed'],
        required: true 
      },
      dependents: { type: Number, required: true }
    },
    required: true
  })
  personalInfo: PersonalInfo;

  @Prop({
    type: {
      employmentType: {
        type: String,
        enum: ['employee', 'self_employed', 'business_owner', 'retired', 'unemployed'],
        required: true
      },
      companyName: String,
      position: String,
      monthlyIncome: { type: Number, required: true },
      workExperience: { type: Number, required: true },
      workAddress: String,
      workPhone: String
    },
    required: true
  })
  employmentInfo: EmploymentInfo;

  @Prop({
    type: {
      requestedAmount: { type: Number, required: true },
      downPayment: { type: Number, required: true },
      preferredTerm: { type: Number, required: true },
      monthlyExpenses: { type: Number, required: true },
      otherDebts: { type: Number, required: true },
      bankName: { type: String, required: true },
      accountType: { 
        type: String, 
        enum: ['checking', 'savings'],
        required: true 
      }
    },
    required: true
  })
  financialInfo: FinancialInfo;

  @Prop({
    type: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
      address: String
    },
    required: true
  })
  emergencyContact: EmergencyContact;

  @Prop({
    type: [{
      id: String,
      url: String,
      type: { 
        type: String, 
        enum: ['identification', 'income_proof', 'address_proof', 'bank_statement', 'other']
      },
      name: String,
      size: Number,
      uploadedAt: Date
    }],
    default: []
  })
  documents: DocumentFile[];

  @Prop({
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';

  @Prop({
    type: {
      reviewedBy: String, // Clerk ID
      reviewedAt: Date,
      approvedAmount: Number,
      approvedTerm: Number,
      interestRate: Number,
      monthlyPayment: Number,
      comments: String,
      rejectionReason: String
    }
  })
  reviewInfo?: ReviewInfo;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  submittedAt?: Date;
}

export const CreditApplicationSchemaFactory = SchemaFactory.createForClass(CreditApplicationSchema);