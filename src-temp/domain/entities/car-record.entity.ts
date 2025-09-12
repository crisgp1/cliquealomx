export interface DocumentFile {
  name: string;
  url: string;
  type: 'image' | 'pdf';
  size?: number;
}

export interface Vehicle {
  brand: string;
  model: string;
  serialNumber?: string;
}

export interface Person {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
}

export interface SaleData {
  vehicle: Vehicle;
  customer: Person;
  seller?: Person;
}

export class CarRecord {
  constructor(
    public id: string,
    public expedientNumber: string,
    public title: string,
    public isSale: boolean,
    public documents: DocumentFile[],
    public createdBy: string, // Clerk ID
    public createdAt: Date,
    public updatedAt: Date,
    public notes?: string,
    public saleData?: SaleData
  ) {}

  static generateExpedientNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Format: EXP-YYYY-TIMESTAMP-RND (e.g., EXP-2024-1703875200000-001)
    return `EXP-${year}-${timestamp}-${random}`;
  }

  addDocument(document: DocumentFile): void {
    this.documents.push(document);
    this.updatedAt = new Date();
  }

  removeDocument(documentName: string): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(doc => doc.name !== documentName);
    
    if (this.documents.length < initialLength) {
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  updateSaleData(saleData: SaleData): void {
    if (!this.isSale) {
      throw new Error('Cannot add sale data to non-sale record');
    }
    this.saleData = saleData;
    this.updatedAt = new Date();
  }

  getDocumentsByType(type: 'image' | 'pdf'): DocumentFile[] {
    return this.documents.filter(doc => doc.type === type);
  }

  getTotalDocumentsSize(): number {
    return this.documents.reduce((total, doc) => total + (doc.size || 0), 0);
  }

  isOwnedBy(userId: string): boolean {
    return this.createdBy === userId;
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('El título es requerido');
    }

    if (!this.expedientNumber) {
      errors.push('El número de expediente es requerido');
    }

    if (this.documents.length === 0) {
      errors.push('Debe incluir al menos un documento');
    }

    if (this.isSale && !this.saleData) {
      errors.push('Los datos de venta son requeridos para registros de venta');
    }

    if (this.isSale && this.saleData) {
      if (!this.saleData.vehicle.brand) {
        errors.push('La marca del vehículo es requerida');
      }
      if (!this.saleData.vehicle.model) {
        errors.push('El modelo del vehículo es requerido');
      }
      if (!this.saleData.customer.name) {
        errors.push('El nombre del cliente es requerido');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toSummary(): {
    id: string;
    expedientNumber: string;
    title: string;
    isSale: boolean;
    documentsCount: number;
    createdAt: Date;
    customerName?: string;
    vehicleInfo?: string;
  } {
    return {
      id: this.id,
      expedientNumber: this.expedientNumber,
      title: this.title,
      isSale: this.isSale,
      documentsCount: this.documents.length,
      createdAt: this.createdAt,
      customerName: this.saleData?.customer.name,
      vehicleInfo: this.saleData ? `${this.saleData.vehicle.brand} ${this.saleData.vehicle.model}` : undefined
    };
  }
}