import { ListingFormDataVO } from '@/domain/value-objects/listing-form-data.vo';

type ValidationRule = (value: unknown, values?: Record<string, unknown>) => string | null;
type ValidationRules = Record<string, ValidationRule>;

export class FormValidationService {
  private static createRequiredValidator(message: string): ValidationRule {
    return (value: unknown) => {
      if (typeof value === 'string') {
        return value.trim() ? null : message;
      }
      return value ? null : message;
    };
  }

  private static createNumberRangeValidator(min: number, max: number, message: string): ValidationRule {
    return (value: unknown) => {
      const num = Number(value);
      return (num >= min && num <= max) ? null : message;
    };
  }

  private static createPositiveNumberValidator(message: string): ValidationRule {
    return (value: unknown) => {
      const num = Number(value);
      return num > 0 ? null : message;
    };
  }

  static createListingFormValidator(): FormValidationService {
    const rules: ValidationRules = {
      title: this.createRequiredValidator('El título es requerido'),
      brand: this.createRequiredValidator('La marca es requerida'),
      model: this.createRequiredValidator('El modelo es requerido'),
      year: this.createNumberRangeValidator(
        1990,
        new Date().getFullYear() + 1,
        'Año inválido'
      ),
      price: this.createPositiveNumberValidator('El precio debe ser mayor a 0'),
      city: this.createRequiredValidator('La ciudad es requerida'),
      state: this.createRequiredValidator('El estado es requerido'),
      phone: this.createRequiredValidator('El teléfono es requerido'),
    };

    return new FormValidationService(rules);
  }

  constructor(private readonly rules: ValidationRules) {}

  validateField(field: string, value: unknown, allValues?: Record<string, unknown>): string | null {
    const rule = this.rules[field];
    return rule ? rule(value, allValues) : null;
  }

  validateAll(data: ListingFormDataVO): Record<string, string> {
    const errors: Record<string, string> = {};
    const flatData = data.toFlatForm();

    Object.keys(this.rules).forEach(field => {
      const error = this.validateField(field, (flatData as unknown as Record<string, unknown>)[field], flatData as unknown as Record<string, unknown>);
      if (error) {
        errors[field] = error;
      }
    });

    return errors;
  }

  toMantineValidation(): Record<string, ValidationRule> {
    return this.rules;
  }
}