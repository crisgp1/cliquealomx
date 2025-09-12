import type { LoaderFunctionArgs } from "@remix-run/node";
import { ListingModel } from "~/models/Listing.server";

// Sitemap específico para listings de autos seminuevos con datos estructurados
export async function loader({ request }: LoaderFunctionArgs) {
  const baseUrl = "https://cliquealo.mx";
  
  // Obtener todos los listings activos
  const activeListings = await ListingModel.findMany({
    status: 'active',
    limit: 50000, // Máximo para sitemap de listings
    skip: 0
  });

  // Generar XML del sitemap con metadatos específicos para autos
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${activeListings.map((listing: any) => {
  const lastmod = listing.updatedAt ? new Date(listing.updatedAt).toISOString() : new Date().toISOString();
  const images = listing.images || [];
  
  return `  <url>
    <loc>${baseUrl}/listings/${listing._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
${images.slice(0, 10).map((image: string) => `    <image:image>
      <image:loc>${image}</image:loc>
      <image:title>${listing.title || ''} - ${listing.year || ''} ${listing.brand || ''} ${listing.model || ''}</image:title>
      <image:caption>Auto seminuevo ${listing.brand || ''} ${listing.model || ''} ${listing.year || ''} en venta en Cliquéalo.mx</image:caption>
    </image:image>`).join('\n')}
  </url>`;
}).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=7200", // Cache por 2 horas
    },
  });
}