import type { LoaderFunctionArgs } from "@remix-run/node";
import { ListingModel } from "~/models/Listing.server";

// Sitemap específico para imágenes de autos para mejorar SEO de Google Images
export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = "https://cliquealo.mx";
  
  // Obtener listings con imágenes
  const listingsWithImages = await ListingModel.findMany({
    status: 'active',
    limit: 10000, // Máximo para sitemap de imágenes
    skip: 0
  });

  // Filtrar solo listings que tengan imágenes
  const listingsWithValidImages = listingsWithImages.filter((listing: any) => 
    listing.images && listing.images.length > 0
  );

  // Generar XML del sitemap con focus en imágenes
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${listingsWithValidImages.map((listing: any) => {
  const lastmod = listing.updatedAt ? new Date(listing.updatedAt).toISOString() : new Date().toISOString();
  const images = listing.images || [];
  
  return `  <url>
    <loc>${baseUrl}/listings/${listing._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${images.slice(0, 15).map((image: string, index: number) => {
  // Crear titles y captions optimizados para SEO
  const brandModel = `${listing.brand || ''} ${listing.model || ''}`.trim();
  const yearBrand = `${listing.year || ''} ${brandModel}`.trim();
  const price = listing.price ? `$${listing.price.toLocaleString()} MXN` : '';
  
  return `    <image:image>
      <image:loc>${image}</image:loc>
      <image:title>${yearBrand} Seminuevo ${index === 0 ? 'Principal' : `Vista ${index + 1}`} | Cliquéalo.mx</image:title>
      <image:caption>Auto seminuevo ${yearBrand} en venta ${price ? `por ${price}` : ''} - Certificado y verificado en Cliquéalo.mx. Financiamiento disponible con enganche desde 30%.</image:caption>
      <image:geo_location>México</image:geo_location>
      <image:license>https://cliquealo.mx/terms</image:license>
    </image:image>`;
}).join('\n')}
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=14400", // Cache por 4 horas
    },
  });
}