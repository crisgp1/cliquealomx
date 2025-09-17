import { ContactInfo, Location, Listing as ListingInterface } from '@/lib/api/listings';

export interface ListingProps {
  id: string;
  userId: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: 'active' | 'sold' | 'reserved' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  images?: string[];
  videos?: string[];
  likesCount: number;
  viewsCount: number;
  features?: string[];
  mileage?: number;
  fuelType?: 'gasolina' | 'diesel' | 'hibrido' | 'electrico';
  transmission?: 'manual' | 'automatico';
  bodyType?: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'coupe' | 'convertible';
  color?: string;
  serialNumber?: string;
  motorNumber?: string;
  location?: Location;
  contactInfo?: ContactInfo;
  isFeatured?: boolean;
  isActive?: boolean;
}

export class Listing {
  constructor(private props: ListingProps) {}

  static fromPrimitives(data: ListingInterface): Listing {
    return new Listing({
      ...(data as unknown as ListingProps),
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
    });
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get title(): string {
    return this.props.title;
  }

  get brand(): string {
    return this.props.brand;
  }

  get model(): string {
    return this.props.model;
  }

  get year(): number {
    return this.props.year;
  }

  get price(): number {
    return this.props.price;
  }

  get status(): string {
    return this.props.status;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get images(): string[] {
    return this.props.images || [];
  }

  get features(): string[] {
    return this.props.features || [];
  }

  get mileage(): number | undefined {
    return this.props.mileage;
  }

  get fuelType(): string | undefined {
    return this.props.fuelType;
  }

  get transmission(): string | undefined {
    return this.props.transmission;
  }

  get bodyType(): string | undefined {
    return this.props.bodyType;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get serialNumber(): string | undefined {
    return this.props.serialNumber;
  }

  get motorNumber(): string | undefined {
    return this.props.motorNumber;
  }

  get location(): Location | undefined {
    return this.props.location;
  }

  get contactInfo(): ContactInfo | undefined {
    return this.props.contactInfo;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured || false;
  }

  get isActive(): boolean {
    return this.props.isActive !== false;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain methods
  updateTitle(title: string): void {
    if (!title.trim()) {
      throw new Error('Title cannot be empty');
    }
    this.props.title = title.trim();
    this.props.updatedAt = new Date();
  }

  updatePrice(price: number): void {
    if (price <= 0) {
      throw new Error('Price must be greater than 0');
    }
    this.props.price = price;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description.trim();
    this.props.updatedAt = new Date();
  }

  addFeature(feature: string): void {
    if (!this.props.features) {
      this.props.features = [];
    }
    if (!this.props.features.includes(feature)) {
      this.props.features.push(feature);
      this.props.updatedAt = new Date();
    }
  }

  removeFeature(feature: string): void {
    if (this.props.features) {
      this.props.features = this.props.features.filter(f => f !== feature);
      this.props.updatedAt = new Date();
    }
  }

  markAsFeatured(): void {
    this.props.isFeatured = true;
    this.props.updatedAt = new Date();
  }

  unmarkAsFeatured(): void {
    this.props.isFeatured = false;
    this.props.updatedAt = new Date();
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  toPrimitives(): ListingProps {
    return { ...this.props };
  }
}