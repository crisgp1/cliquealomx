import { IconCar } from '@tabler/icons-react';
import { memo } from 'react';

interface VehicleIdentitySectionProps {
  formData: Record<string, unknown>;
  handleInputChange: (field: string, value: unknown) => void;
  carBrands: Array<{ value: string; label: string }>;
}

export const VehicleIdentitySection = memo(function VehicleIdentitySection({ formData, handleInputChange, carBrands }: VehicleIdentitySectionProps) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <div className="flex items-center gap-2 mb-6">
        <IconCar size={20} />
        <h3 className="text-lg font-semibold">Información Básica</h3>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título del Anuncio
          </label>
          <p className="text-xs text-gray-500 mb-2">Ejemplo: Honda Civic 2020 Seminuevo</p>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Escribe un título atractivo para tu auto"
            value={(formData.title as string) || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={(formData.brand as string) || ''}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              required
            >
              <option value="">Selecciona la marca</option>
              {carBrands.map((brand) => (
                <option key={brand.value} value={brand.value}>
                  {brand.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ejemplo: Civic, Corolla, Sentra"
              value={(formData.model as string) || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
});