import { memo } from 'react';

interface VehicleSpecsSectionProps {
  formData: Record<string, unknown>;
  handleInputChange: (field: string, value: unknown) => void;
  fuelTypes: Array<{ value: string; label: string }>;
  transmissionTypes: Array<{ value: string; label: string }>;
  bodyTypes: Array<{ value: string; label: string }>;
  commonFeatures: string[];
}

export const VehicleSpecsSection = memo(function VehicleSpecsSection({
  formData,
  handleInputChange,
  fuelTypes,
  transmissionTypes,
  bodyTypes,
  commonFeatures,
}: VehicleSpecsSectionProps) {
  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-lg font-semibold mb-6">Detalles del Vehículo</h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={new Date().getFullYear().toString()}
              min={1990}
              max={new Date().getFullYear() + 1}
              value={(formData.year as number) || new Date().getFullYear()}
              onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 0)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (MXN) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="285000"
                min={0}
                step={1000}
                value={(formData.price as number) || 0}
                onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <p className="text-xs text-gray-500 mb-2">Describe las características y condiciones de tu auto</p>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Excelente estado, un solo dueño, mantenimientos al día..."
            rows={3}
            value={(formData.description as string) || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kilometraje
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="45000"
              min={0}
              step={1000}
              value={(formData.mileage as number) || 0}
              onChange={(e) => handleInputChange('mileage', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Combustible
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={(formData.fuelType as string) || ''}
              onChange={(e) => handleInputChange('fuelType', e.target.value)}
            >
              <option value="">Selecciona</option>
              {fuelTypes.map((fuel) => (
                <option key={fuel.value} value={fuel.value}>
                  {fuel.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transmisión
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={(formData.transmission as string) || ''}
              onChange={(e) => handleInputChange('transmission', e.target.value)}
            >
              <option value="">Selecciona</option>
              {transmissionTypes.map((transmission) => (
                <option key={transmission.value} value={transmission.value}>
                  {transmission.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Carrocería
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={(formData.bodyType as string) || ''}
              onChange={(e) => handleInputChange('bodyType', e.target.value)}
            >
              <option value="">Selecciona</option>
              {bodyTypes.map((body) => (
                <option key={body.value} value={body.value}>
                  {body.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ejemplo: Blanco, Negro, Plata"
              value={(formData.color as string) || ''}
              onChange={(e) => handleInputChange('color', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Serie (VIN)
            </label>
            <p className="text-xs text-gray-500 mb-2">Opcional - Para mayor confianza</p>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1HGBH41JXMN109186"
              value={(formData.serialNumber as string) || ''}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Motor
            </label>
            <p className="text-xs text-gray-500 mb-2">Opcional</p>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="K20A3"
              value={(formData.motorNumber as string) || ''}
              onChange={(e) => handleInputChange('motorNumber', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Características y Equipamiento
          </label>
          <p className="text-xs text-gray-500 mb-2">Selecciona todas las características que apliquen</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {commonFeatures.map((feature) => (
              <label key={feature} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={((formData.features as string[]) || []).includes(feature)}
                  onChange={(e) => {
                    const currentFeatures = (formData.features as string[]) || [];
                    const newFeatures = e.target.checked
                      ? [...currentFeatures, feature]
                      : currentFeatures.filter((f: string) => f !== feature);
                    handleInputChange('features', newFeatures);
                  }}
                />
                <span className="text-sm">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});