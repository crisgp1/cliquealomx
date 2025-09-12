import type { LoaderFunctionArgs } from "@remix-run/node";

// Sitemap específico para marcas de autos para mejorar SEO por marca
export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = "https://cliquealo.mx";
  const currentDate = new Date().toISOString();
  
  // Marcas principales con alta demanda en México
  const popularBrands = [
    // Marcas japonesas (muy populares en México)
    { name: 'Toyota', priority: '1.0', models: ['Camry', 'Corolla', 'RAV4', 'Prius', 'Yaris', 'Sienna'] },
    { name: 'Honda', priority: '0.9', models: ['Civic', 'Accord', 'CR-V', 'Fit', 'Pilot', 'HR-V'] },
    { name: 'Nissan', priority: '0.9', models: ['Sentra', 'Versa', 'Altima', 'X-Trail', 'March', 'Tsuru'] },
    { name: 'Mazda', priority: '0.8', models: ['CX-5', 'Mazda3', 'CX-3', 'Mazda6', 'CX-9', 'MX-5'] },
    
    // Marcas americanas
    { name: 'Ford', priority: '0.8', models: ['Focus', 'Fiesta', 'Escape', 'F-150', 'Fusion', 'EcoSport'] },
    { name: 'Chevrolet', priority: '0.8', models: ['Aveo', 'Cruze', 'Sonic', 'Trax', 'Equinox', 'Silverado'] },
    { name: 'Dodge', priority: '0.7', models: ['Journey', 'Attitude', 'Ram', 'Charger', 'Challenger', 'Durango'] },
    { name: 'Jeep', priority: '0.7', models: ['Compass', 'Grand Cherokee', 'Wrangler', 'Renegade', 'Cherokee'] },
    
    // Marcas europeas
    { name: 'Volkswagen', priority: '0.8', models: ['Jetta', 'Golf', 'Passat', 'Tiguan', 'Polo', 'Vento'] },
    { name: 'BMW', priority: '0.7', models: ['Serie 3', 'X3', 'X5', 'Serie 1', 'Serie 5', 'X1'] },
    { name: 'Mercedes-Benz', priority: '0.7', models: ['Clase C', 'GLA', 'GLC', 'Clase A', 'Clase E', 'GLE'] },
    { name: 'Audi', priority: '0.7', models: ['A3', 'Q5', 'A4', 'Q3', 'A6', 'Q7'] },
    
    // Marcas coreanas (creciendo en México)
    { name: 'Hyundai', priority: '0.8', models: ['Accent', 'Elantra', 'Tucson', 'Grand i10', 'Santa Fe', 'Creta'] },
    { name: 'Kia', priority: '0.8', models: ['Rio', 'Forte', 'Sportage', 'Soul', 'Sorento', 'Picanto'] }
  ];

  // URLs para marcas principales
  const brandPages = popularBrands.flatMap(brand => {
    const brandUrls = [
      {
        url: `${baseUrl}/listings?brand=${encodeURIComponent(brand.name)}`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: brand.priority
      }
    ];

    // Agregar URLs para modelos específicos de cada marca
    brand.models.forEach(model => {
      brandUrls.push({
        url: `${baseUrl}/listings?search=${encodeURIComponent(`${brand.name} ${model}`)}`,
        lastmod: currentDate,
        changefreq: 'daily',  
        priority: '0.7'
      });
    });

    // Agregar URLs para años específicos por marca
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
      brandUrls.push({
        url: `${baseUrl}/listings?brand=${encodeURIComponent(brand.name)}&minYear=${year}&maxYear=${year}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.6'
      });
    }

    return brandUrls;
  });

  // URLs para combinaciones de marca + tipo de vehículo
  const vehicleTypes = ['sedán', 'SUV', 'hatchback', 'pickup', 'camioneta'];
  const brandTypePages = popularBrands.flatMap(brand => 
    vehicleTypes.map(type => ({
      url: `${baseUrl}/listings?search=${encodeURIComponent(`${brand.name} ${type}`)}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.6'
    }))
  );

  // URLs para marcas + rangos de precio
  const priceRanges = [
    { min: 100000, max: 200000, label: '100k-200k' },
    { min: 200000, max: 300000, label: '200k-300k' },
    { min: 300000, max: 500000, label: '300k-500k' }
  ];

  const brandPricePages = popularBrands.flatMap(brand =>
    priceRanges.map(range => ({
      url: `${baseUrl}/listings?brand=${encodeURIComponent(brand.name)}&minPrice=${range.min}&maxPrice=${range.max}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.5'
    }))
  );

  // Combinar todas las URLs
  const allPages = [
    ...brandPages,
    ...brandTypePages,
    ...brandPricePages
  ];

  // Generar XML del sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400", // Cache por 24 horas
    },
  });
}