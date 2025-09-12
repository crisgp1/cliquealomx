export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  name?: string;
  size?: number;
  uploadedAt: Date;
}

export interface VehicleDocument {
  id: string;
  name: string;
  type: 'factura' | 'tarjeta_circulacion' | 'verificacion' | 'tenencia' | 'seguro' | 'repuve' | 'otro';
  url: string;
  uploadedAt: Date;
  notes?: string;
}

export interface Location {
  city: string;
  state: string;
}

export interface ContactInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
}

export class Listing {
  constructor(
    public id: string,
    public userId: string, // Clerk ID
    public title: string,
    public brand: string,
    public model: string,
    public year: number,
    public price: number,
    public status: 'active' | 'sold' | 'reserved' | 'inactive',
    public createdAt: Date,
    public updatedAt: Date,
    public description?: string,
    public images?: string[],
    public videos?: string[],
    public media?: MediaFile[],
    public likesCount: number = 0,
    public viewsCount: number = 0,
    public features?: string[],
    public mileage?: number,
    public fuelType?: 'gasolina' | 'diesel' | 'hibrido' | 'electrico',
    public transmission?: 'manual' | 'automatico',
    public bodyType?: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible',
    public color?: string,
    public location?: Location,
    public contactInfo?: ContactInfo,
    public serialNumber?: string,
    public motorNumber?: string,
    public vehicleDocuments?: VehicleDocument[],
    public soldAt?: Date,
    public isFeatured?: boolean
  ) {}

  incrementViews(): void {
    this.viewsCount += 1;
    this.updatedAt = new Date();
  }

  incrementLikes(): void {
    this.likesCount += 1;
    this.updatedAt = new Date();
  }

  decrementLikes(): void {
    this.likesCount = Math.max(0, this.likesCount - 1);
    this.updatedAt = new Date();
  }

  markAsSold(soldAt?: Date): void {
    this.status = 'sold';
    this.soldAt = soldAt || new Date();
    this.updatedAt = new Date();
  }

  updateStatus(status: 'active' | 'sold' | 'reserved' | 'inactive'): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  toggleFeatured(): void {
    this.isFeatured = !this.isFeatured;
    this.updatedAt = new Date();
  }

  addVehicleDocument(document: Omit<VehicleDocument, 'id' | 'uploadedAt'>): VehicleDocument {
    const vehicleDoc: VehicleDocument = {
      ...document,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date()
    };

    if (!this.vehicleDocuments) {
      this.vehicleDocuments = [];
    }
    this.vehicleDocuments.push(vehicleDoc);
    this.updatedAt = new Date();

    return vehicleDoc;
  }

  removeVehicleDocument(documentId: string): boolean {
    if (!this.vehicleDocuments) return false;

    const initialLength = this.vehicleDocuments.length;
    this.vehicleDocuments = this.vehicleDocuments.filter(doc => doc.id !== documentId);
    
    if (this.vehicleDocuments.length < initialLength) {
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }
}