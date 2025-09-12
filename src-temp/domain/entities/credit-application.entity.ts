export interface DocumentFile {
  id: string;
  url: string;
  type: 'identification' | 'income_proof' | 'address_proof' | 'bank_statement' | 'other';
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  curp: string;
  rfc?: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dependents: number;
}

export interface EmploymentInfo {
  employmentType: 'employee' | 'self_employed' | 'business_owner' | 'retired' | 'unemployed';
  companyName?: string;
  position?: string;
  monthlyIncome: number;
  workExperience: number;
  workAddress?: string;
  workPhone?: string;
}

export interface FinancialInfo {
  requestedAmount: number;
  downPayment: number;
  preferredTerm: number;
  monthlyExpenses: number;
  otherDebts: number;
  bankName: string;
  accountType: 'checking' | 'savings';
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface ReviewInfo {
  reviewedBy: string; // Clerk ID del admin
  reviewedAt: Date;
  approvedAmount?: number;
  approvedTerm?: number;
  interestRate?: number;
  monthlyPayment?: number;
  comments?: string;
  rejectionReason?: string;
}

export class CreditApplication {
  constructor(
    public id: string,
    public userId: string, // Clerk ID del usuario
    public personalInfo: PersonalInfo,
    public employmentInfo: EmploymentInfo,
    public financialInfo: FinancialInfo,
    public emergencyContact: EmergencyContact,
    public documents: DocumentFile[],
    public status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled',
    public createdAt: Date,
    public updatedAt: Date,
    public listingId?: string,
    public reviewInfo?: ReviewInfo,
    public submittedAt?: Date
  ) {}

  submit(): void {
    this.status = 'under_review';
    this.submittedAt = new Date();
    this.updatedAt = new Date();
  }

  approve(reviewInfo: Omit<ReviewInfo, 'reviewedAt'>): void {
    this.status = 'approved';
    this.reviewInfo = {
      ...reviewInfo,
      reviewedAt: new Date()
    };
    this.updatedAt = new Date();
  }

  reject(reviewInfo: Omit<ReviewInfo, 'reviewedAt'>): void {
    this.status = 'rejected';
    this.reviewInfo = {
      ...reviewInfo,
      reviewedAt: new Date()
    };
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  addDocument(document: Omit<DocumentFile, 'id' | 'uploadedAt'>): DocumentFile {
    const documentFile: DocumentFile = {
      ...document,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date()
    };

    this.documents.push(documentFile);
    this.updatedAt = new Date();

    return documentFile;
  }

  removeDocument(documentId: string): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.id !== documentId);
    
    if (this.documents.length < initialLength) {
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  canBeReviewed(): boolean {
    return this.status === 'pending' || this.status === 'under_review';
  }

  canBeModified(): boolean {
    return this.status === 'pending';
  }
}