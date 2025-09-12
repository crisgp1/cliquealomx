import type { LoaderFunctionArgs } from "@remix-run/node";
import { ListingModel } from "~/models/Listing.server";

// Función para generar sitemap principal optimizado para SEO de autos seminuevos
export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = "https://cliquealo.mx";
  const currentDate = new Date().toISOString();
  
  // Obtener listings activos para el sitemap
  const activeListings = await ListingModel.findMany({
    status: 'active',
    limit: 1000, // Máximo recomendado por sitemap
    skip: 0
  });

  // URLs estáticas principales con prioridades SEO
  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/listings`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9'
    },
    {
      url: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      url: `${baseUrl}/credit/simulator`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/credit/apply`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    }
  ];

  // URLs de marcas populares para SEO
  const popularBrands = [
    'Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet', 'Volkswagen',
    'Hyundai', 'Kia', 'Mazda', 'BMW', 'Mercedes-Benz', 'Audi'
  ];

  const brandPages = popularBrands.map(brand => ({
    url: `${baseUrl}/listings?brand=${encodeURIComponent(brand)}`,
    lastmod: currentDate,
    changefreq: 'daily',
    priority: '0.8'
  }));

  // URLs de años populares para SEO de autos seminuevos
  const popularYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
  const yearPages = popularYears.map(year => ({
    url: `${baseUrl}/listings?minYear=${year}&maxYear=${year}`,
    lastmod: currentDate,
    changefreq: 'daily',
    priority: '0.7'
  }));

  // URLs de rangos de precios para SEO
  const priceRanges = [
    { min: 50000, max: 100000 },
    { min: 100000, max: 200000 },
    { min: 200000, max: 300000 },
    { min: 300000, max: 500000 },
    { min: 500000, max: 1000000 }
  ];

  const pricePages = priceRanges.map(range => ({
    url: `${baseUrl}/listings?minPrice=${range.min}&maxPrice=${range.max}`,
    lastmod: currentDate,
    changefreq: 'daily',
    priority: '0.6'
  }));

  // URLs de listings individuales
  const listingPages = activeListings.map((listing: any) => ({
    url: `${baseUrl}/listings/${listing._id}`,
    lastmod: listing.updatedAt ? new Date(listing.updatedAt).toISOString() : currentDate,
    changefreq: 'weekly',
    priority: '0.9'
  }));

  // Combinar todas las URLs
  const allPages = [
    ...staticPages,
    ...brandPages,
    ...yearPages,
    ...pricePages,
    ...listingPages
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
      "Cache-Control": "public, max-age=3600", // Cache por 1 hora
    },
  });
}