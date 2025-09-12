import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsEnum, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}

class ContactInfoDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  year: number;

  @IsNumber()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  mileage: number;

  @IsString()
  @IsNotEmpty()
  fuelType: string;

  @IsString()
  @IsNotEmpty()
  transmission: string;

  @IsString()
  @IsNotEmpty()
  bodyType: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  motorNumber?: string;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsBoolean()
  isFeatured: boolean;
}