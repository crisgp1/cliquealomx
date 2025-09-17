import { Listing } from '@/domain/entities/listing.entity';
import { ListingFormDataVO } from '@/domain/value-objects/listing-form-data.vo';

export interface ListingUpdateRequest {
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
  serialNumber?: string;
  motorNumber?: string;
  city: string;
  state: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  features: string[];
  isFeatured: boolean;
}

export class ListingFormAdapter {
  static fromEntity(listing: Listing): ListingFormDataVO {
    return new ListingFormDataVO(
      listing.title,
      listing.brand,
      listing.model,
      listing.year,
      listing.price,
      listing.description || '',
      listing.mileage || 0,
      listing.fuelType || '',
      listing.transmission || '',
      listing.bodyType || '',
      listing.color || '',
      listing.serialNumber || '',
      listing.motorNumber || '',
      listing.location?.city || '',
      listing.location?.state || '',
      listing.contactInfo?.phone || '',
      listing.contactInfo?.whatsapp || '',
      listing.contactInfo?.email || '',
      listing.features || [],
      listing.isFeatured || false
    );
  }

  static toUpdateRequest(formData: ListingFormDataVO): ListingUpdateRequest {
    return {
      title: formData.title,
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      price: formData.price,
      description: formData.description,
      mileage: formData.mileage,
      fuelType: formData.fuelType,
      transmission: formData.transmission,
      bodyType: formData.bodyType,
      color: formData.color,
      serialNumber: formData.serialNumber || undefined,
      motorNumber: formData.motorNumber || undefined,
      city: formData.city,
      state: formData.state,
      phone: formData.phone,
      whatsapp: formData.whatsapp || undefined,
      email: formData.email || undefined,
      features: formData.features,
      isFeatured: formData.isFeatured,
    };
  }

  static validateBusinessRules(formData: ListingFormDataVO): string[] {
    const errors: string[] = [];

    if (!formData.isValid()) {
      errors.push('Datos del formulario incompletos');
    }

    if (formData.price < 1000) {
      errors.push('El precio mínimo es $1,000 MXN');
    }

    if (formData.year > new Date().getFullYear() + 1) {
      errors.push('No se pueden registrar vehículos de años futuros');
    }

    return errors;
  }
}