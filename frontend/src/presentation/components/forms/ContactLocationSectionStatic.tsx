import { IconMapPin, IconPhone, IconMail, IconBrandWhatsapp, IconFileText } from '@tabler/icons-react';
import { memo } from 'react';

interface ContactLocationSectionProps {
  formData: Record<string, unknown>;
  handleInputChange: (field: string, value: unknown) => void;
  mexicanStates: Array<{ value: string; label: string }>;
}

export const ContactLocationSection = memo(function ContactLocationSection({ formData, handleInputChange, mexicanStates }: ContactLocationSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center gap-2 mb-6">
          <IconMapPin size={20} />
          <h3 className="text-lg font-semibold">Ubicación y Contacto</h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Guadalajara"
                value={(formData.city as string) || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={(formData.state as string) || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
              >
                <option value="">Selecciona tu estado</option>
                {mexicanStates.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Número principal</p>
              <div className="relative">
                <IconPhone size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+52 33 1234 5678"
                  value={(formData.phone as string) || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <p className="text-xs text-gray-500 mb-2">Opcional</p>
              <div className="relative">
                <IconBrandWhatsapp size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+52 33 1234 5678"
                  value={(formData.whatsapp as string) || ''}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-xs text-gray-500 mb-2">Opcional</p>
              <div className="relative">
                <IconMail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contacto@email.com"
                  value={(formData.email as string) || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center gap-2 mb-6">
          <IconFileText size={20} />
          <h3 className="text-lg font-semibold">Opciones Adicionales</h3>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="isFeatured"
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={(formData.isFeatured as boolean) || false}
            onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
          />
          <div>
            <label htmlFor="isFeatured" className="block text-sm font-medium text-gray-700">
              Anuncio Destacado
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Tu anuncio aparecerá en las primeras posiciones (costo adicional)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});