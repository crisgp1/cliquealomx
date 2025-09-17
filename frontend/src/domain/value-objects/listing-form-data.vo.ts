export interface ListingFormFlatData {
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  description: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  serialNumber: string;
  motorNumber: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  features: string[];
  isFeatured: boolean;
}

export class ListingFormDataVO {
  constructor(
    public readonly title: string,
    public readonly brand: string,
    public readonly model: string,
    public readonly year: number,
    public readonly price: number,
    public readonly description: string,
    public readonly mileage: number,
    public readonly fuelType: string,
    public readonly transmission: string,
    public readonly bodyType: string,
    public readonly color: string,
    public readonly serialNumber: string,
    public readonly motorNumber: string,
    public readonly city: string,
    public readonly state: string,
    public readonly phone: string,
    public readonly whatsapp: string,
    public readonly email: string,
    public readonly features: string[],
    public readonly isFeatured: boolean
  ) {}

  static fromFlatForm(data: ListingFormFlatData): ListingFormDataVO {
    return new ListingFormDataVO(
      data.title || '',
      data.brand || '',
      data.model || '',
      data.year || new Date().getFullYear(),
      data.price || 0,
      data.description || '',
      data.mileage || 0,
      data.fuelType || '',
      data.transmission || '',
      data.bodyType || '',
      data.color || '',
      data.serialNumber || '',
      data.motorNumber || '',
      data.city || '',
      data.state || '',
      data.phone || '',
      data.whatsapp || '',
      data.email || '',
      data.features || [],
      data.isFeatured || false
    );
  }

  toFlatForm(): ListingFormFlatData {
    return {
      title: this.title,
      brand: this.brand,
      model: this.model,
      year: this.year,
      price: this.price,
      description: this.description,
      mileage: this.mileage,
      fuelType: this.fuelType,
      transmission: this.transmission,
      bodyType: this.bodyType,
      color: this.color,
      serialNumber: this.serialNumber,
      motorNumber: this.motorNumber,
      city: this.city,
      state: this.state,
      phone: this.phone,
      whatsapp: this.whatsapp,
      email: this.email,
      features: this.features,
      isFeatured: this.isFeatured,
    };
  }

  isValid(): boolean {
    return !!(
      this.title.trim() &&
      this.brand.trim() &&
      this.model.trim() &&
      this.year > 1990 &&
      this.price > 0 &&
      this.city.trim() &&
      this.state.trim() &&
      this.phone.trim()
    );
  }

  validateField(field: keyof ListingFormFlatData): string | null {
    switch (field) {
      case 'title':
        return this.title.trim() ? null : 'El título es requerido';
      case 'brand':
        return this.brand.trim() ? null : 'La marca es requerida';
      case 'model':
        return this.model.trim() ? null : 'El modelo es requerido';
      case 'year':
        return this.year >= 1990 && this.year <= new Date().getFullYear() + 1
          ? null : 'Año inválido';
      case 'price':
        return this.price > 0 ? null : 'El precio debe ser mayor a 0';
      case 'city':
        return this.city.trim() ? null : 'La ciudad es requerida';
      case 'state':
        return this.state.trim() ? null : 'El estado es requerido';
      case 'phone':
        return this.phone.trim() ? null : 'El teléfono es requerido';
      default:
        return null;
    }
  }
}