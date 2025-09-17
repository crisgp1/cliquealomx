// Comprehensive vehicle brands database with categories
export const VEHICLE_BRANDS = {
  // Premium/Luxury Cars
  premium: [
    'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Cadillac', 'Ferrari',
    'Genesis', 'Infiniti', 'Jaguar', 'Lamborghini', 'Land Rover', 'Lexus',
    'Lincoln', 'Lotus', 'Maserati', 'McLaren', 'Mercedes-Benz', 'Porsche',
    'Rolls-Royce', 'Tesla', 'Volvo'
  ],

  // Mainstream Cars
  mainstream: [
    'Acura', 'Alfa Romeo', 'Buick', 'Chevrolet', 'Chrysler', 'Citroën',
    'Dodge', 'Fiat', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Jeep', 'Kia',
    'Mazda', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Pontiac',
    'Ram', 'Renault', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Toyota',
    'Volkswagen'
  ],

  // Commercial/Trucks
  commercial: [
    'DAF', 'Freightliner', 'Hino', 'International', 'Isuzu', 'Iveco',
    'Kenworth', 'Mack', 'MAN', 'Mercedes-Benz Commercial', 'Peterbilt',
    'Scania', 'Volvo Trucks', 'Western Star'
  ],

  // Motorcycles
  motorcycles: [
    'Aprilia', 'BMW Motorrad', 'Ducati', 'Harley-Davidson', 'Honda Motorcycles',
    'Indian Motorcycle', 'Kawasaki', 'KTM', 'Moto Guzzi', 'MV Agusta',
    'Norton', 'Piaggio', 'Royal Enfield', 'Suzuki Motorcycles', 'Triumph',
    'Vespa', 'Yamaha'
  ],

  // Mexican/Latin American Brands
  mexican: [
    'DINA', 'Mastretta', 'VAM', 'Borgward México'
  ],

  // Chinese Brands
  chinese: [
    'BYD', 'Changan', 'Chery', 'Geely', 'Great Wall', 'Haval', 'JAC',
    'Lynk & Co', 'MG Motor', 'NIO', 'Polestar', 'Xpeng'
  ],

  // Korean Brands (additional)
  korean: [
    'Daewoo', 'SsangYong'
  ],

  // Japanese Brands (additional)
  japanese: [
    'Daihatsu', 'Scion'
  ],

  // Electric/Alternative
  electric: [
    'Lucid Motors', 'Rivian', 'Fisker', 'Canoo', 'Lordstown Motors',
    'Faraday Future', 'Byton'
  ],

  // Classic/Vintage
  classic: [
    'Austin', 'DeLorean', 'Duesenberg', 'Edsel', 'Hudson', 'Oldsmobile',
    'Packard', 'Plymouth', 'Saab', 'Saturn', 'Studebaker', 'Tucker'
  ],

  // Specialty/Kit Cars
  specialty: [
    'Ariel', 'Caterham', 'Factory Five', 'Koenigsegg', 'Morgan',
    'Noble', 'Pagani', 'Radical', 'Spyker'
  ]
};

// Flatten all brands into a single searchable array
export const ALL_VEHICLE_BRANDS = Object.values(VEHICLE_BRANDS).flat().sort();

// Create the data structure for Mantine Select
export const BRAND_OPTIONS = [
  // Add category headers for better organization
  { group: 'Marcas Premium', items: VEHICLE_BRANDS.premium.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Marcas Principales', items: VEHICLE_BRANDS.mainstream.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Motocicletas', items: VEHICLE_BRANDS.motorcycles.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Vehículos Comerciales', items: VEHICLE_BRANDS.commercial.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Marcas Chinas', items: VEHICLE_BRANDS.chinese.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Vehículos Eléctricos', items: VEHICLE_BRANDS.electric.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Clásicos/Vintage', items: VEHICLE_BRANDS.classic.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
  { group: 'Especialidad', items: VEHICLE_BRANDS.specialty.map(brand => ({ value: brand.toLowerCase().replace(/\s+/g, '-'), label: brand })) },
];

// Simple flat array for basic select (backwards compatibility)
export const SIMPLE_BRAND_OPTIONS = ALL_VEHICLE_BRANDS.map(brand => ({
  value: brand.toLowerCase().replace(/\s+/g, '-'),
  label: brand
}));

// Add "Other" option
export const BRAND_OPTIONS_WITH_OTHER = [
  ...SIMPLE_BRAND_OPTIONS,
  { value: 'otra', label: '🔧 Otra marca (especificar)' }
];

// Search function for filtering brands
export function searchBrands(query: string): Array<{ value: string; label: string }> {
  if (!query) return BRAND_OPTIONS_WITH_OTHER;

  const normalizedQuery = query.toLowerCase().trim();

  return BRAND_OPTIONS_WITH_OTHER.filter(brand => {
    const normalizedLabel = brand.label.toLowerCase();

    // Exact match gets priority
    if (normalizedLabel === normalizedQuery) {
      return true;
    }

    // Starts with query
    if (normalizedLabel.startsWith(normalizedQuery)) {
      return true;
    }

    // Contains query (partial match)
    if (normalizedLabel.includes(normalizedQuery)) {
      return true;
    }

    // Word boundary matches (for multi-word brands)
    const words = normalizedLabel.split(/[\s-]+/);
    return words.some(word =>
      word.startsWith(normalizedQuery) ||
      word.includes(normalizedQuery)
    );
  });
}

// Get brand display name from value
export function getBrandDisplayName(value: string): string {
  const brand = BRAND_OPTIONS_WITH_OTHER.find(b => b.value === value);
  return brand ? brand.label : value;
}