/**
 * SEO Utilities
 * Funciones y tipos para mejorar el SEO en todas las páginas de la aplicación
 */

import type { MetaDescriptor } from "@remix-run/node";

// Tipo base para SEO que todas las páginas deberían implementar
export type SeoBase = {
  title: string;
  description: string;
  url: string;
  keywords?: string;
};

// Tipo extendido para SEO de listados de vehículos
export type CarListingSeo = SeoBase & {
  brand?: string;
  model?: string;
  year?: number;
  price?: number;
  image?: string;
  condition?: string;
  location?: {
    city?: string;
    state?: string;
  };
};

// Configuración por defecto del sitio web optimizada para SEO
export const DEFAULT_SEO = {
  title: "Cliquéalo.mx - Autos Seminuevos Certificados | Compra y Venta de Vehículos Usados #1 en México",
  description: "🚗 Encuentra tu auto seminuevo ideal en Cliquéalo.mx. Más de 500+ vehículos certificados con financiamiento, garantía y los mejores precios en México. Toyota, Honda, Nissan ¡Compra seguro!",
  site_name: "Cliquéalo.mx",
  url: "https://cliquealo.mx",
  // Keywords optimizadas para autos seminuevos en México
  keywords: [
    // Términos principales de alta competencia
    "autos seminuevos", "carros usados México", "vehículos certificados", "compra venta autos", 
    "autos con financiamiento", "seminuevos con garantía", "agencia autos usados",
    
    // Long-tail keywords de alta conversión
    "autos seminuevos Toyota Honda Nissan", "carros usados CDMX Guadalajara Monterrey",
    "vehículos seminuevos financiamiento", "autos certificados agencia México",
    "comprar auto seminuevo seguro", "venta autos usados verificados",
    "autos seminuevos crédito fácil", "carros usados garantía",
    
    // Términos por marcas populares
    "Toyota seminuevos México", "Honda usados certificados", "Nissan seminuevos garantía",
    "Ford usados México", "Chevrolet seminuevos", "Volkswagen usados",
    "Hyundai seminuevos", "Kia usados", "Mazda seminuevos",
    
    // Términos por tipo de vehículo
    "sedán seminuevo", "SUV usada México", "pickup seminueva", 
    "hatchback usado", "camioneta seminueva", "compacto usado",
    
    // Términos financieros
    "crédito automotriz", "financiamiento autos", "enganche bajo autos",
    "préstamo para auto", "crédito para vehículo", "autos a crédito",
    
    // Términos geográficos
    "autos usados CDMX", "seminuevos Guadalajara", "carros usados Monterrey",
    "autos Puebla", "seminuevos Querétaro", "carros Tijuana",
    
    // Términos de confianza y calidad
    "autos verificados", "seminuevos revisados", "carros inspeccionados",
    "autos con historia", "vehículos sin accidentes", "carros una sola dueña"
  ].join(", "),
  locale: "es_MX",
  twitter_handle: "@cliquealo_mx",
  image: "https://cliquealo.mx/assets/og-autos-seminuevos.jpg",
  type: "website"
};

/**
 * Genera meta tags SEO básicos para todas las páginas
 */
export function generateBasicMeta({ 
  title, 
  description, 
  url,
  keywords = DEFAULT_SEO.keywords
}: SeoBase): MetaDescriptor[] {
  const fullTitle = title === DEFAULT_SEO.title 
    ? title 
    : `${title} | ${DEFAULT_SEO.site_name}`;

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "robots", content: "index, follow" },
    { name: "language", content: "Spanish" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:site_name", content: DEFAULT_SEO.site_name },
    { property: "og:locale", content: DEFAULT_SEO.locale },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: DEFAULT_SEO.twitter_handle },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:creator", content: DEFAULT_SEO.twitter_handle },
    { name: "apple-mobile-web-app-title", content: DEFAULT_SEO.site_name },
    { name: "application-name", content: DEFAULT_SEO.site_name },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { rel: "canonical", href: url },
  ];
}

/**
 * Genera meta tags específicos para listados de autos
 */
export function generateCarListingMeta({
  title,
  description,
  url,
  brand,
  model,
  year,
  price,
  image,
  condition = "Usado",
  location,
  keywords,
}: CarListingSeo): MetaDescriptor[] {
  const defaultKeywords = `${brand || ''} ${model || ''} ${year || ''}, autos usados, compra de autos, venta de autos, ${location?.city || ''}, ${location?.state || ''}, méxico`;
  const carKeywords = keywords || defaultKeywords;
  
  const baseMetaTags = generateBasicMeta({
    title,
    description,
    url,
    keywords: carKeywords,
  });

  // Metadatos adicionales específicos para un listado de auto
  const carSpecificTags: MetaDescriptor[] = [
    // Open Graph mejorado para producto
    { property: "og:type", content: "product" },
    { property: "og:availability", content: "instock" },
    { property: "og:price:amount", content: price?.toString() || "" },
    { property: "og:price:currency", content: "MXN" },
    { property: "og:brand", content: brand || "" },
    
    // Metadatos específicos para productos
    { property: "product:brand", content: brand || "" },
    { property: "product:availability", content: "in stock" },
    { property: "product:condition", content: condition },
    { property: "product:price:amount", content: price?.toString() || "" },
    { property: "product:price:currency", content: "MXN" },
    
    // Twitter Card específica para productos
    { name: "twitter:card", content: "product" },
    { name: "twitter:data1", content: `$${price?.toLocaleString() || ""} MXN` },
    { name: "twitter:label1", content: "Precio" },
    { name: "twitter:data2", content: `${year || ""} ${brand || ""} ${model || ""}` },
    { name: "twitter:label2", content: "Modelo" },
  ];

  // Añadir imagen si está disponible
  if (image) {
    const imageTags: MetaDescriptor[] = [
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { name: "twitter:image", content: image }
    ];
    return [...baseMetaTags, ...carSpecificTags, ...imageTags];
  }

  return [...baseMetaTags, ...carSpecificTags];
}

/**
 * Genera un objeto JSON-LD para un listado de auto (para Rich Results)
 */
export function generateCarListingJsonLd({
  title,
  description,
  url,
  brand,
  model,
  year,
  price,
  image,
  condition = "UsedCondition", // Schema.org usa específicamente UsedCondition
  location,
}: CarListingSeo): string {
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Vehicle",
    name: title,
    description: description,
    brand: {
      "@type": "Brand",
      name: brand
    },
    model: model,
    modelDate: year,
    vehicleModelDate: year,
    vehicleIdentificationNumber: "", // Se podría agregar si está disponible
    url: url,
    image: image || DEFAULT_SEO.image,
    offers: {
      "@type": "Offer",
      priceCurrency: "MXN",
      price: price,
      availability: "https://schema.org/InStock",
      itemCondition: `https://schema.org/${condition}`,
      seller: {
        "@type": "Organization",
        name: DEFAULT_SEO.site_name,
        url: DEFAULT_SEO.url
      }
    }
  };

  if (location?.city && location?.state) {
    // Añadir ubicación si está disponible
    Object.assign(jsonLd, {
      availableAtOrFrom: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: location.city,
          addressRegion: location.state,
          addressCountry: "MX"
        }
      }
    });
  }

  return JSON.stringify(jsonLd);
}

/**
 * Genera un objeto JSON-LD para la organización (para Rich Results en búsquedas de la marca)
 */
export function generateOrganizationJsonLd(): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SEO.site_name,
    url: DEFAULT_SEO.url,
    logo: `${DEFAULT_SEO.url}/assets/logo.webp`,
    sameAs: [
      "https://www.facebook.com/cliquealo",
      "https://www.instagram.com/cliquealo_mx",
      "https://twitter.com/cliquealo_mx"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+52-XXX-XXX-XXXX",
      contactType: "customer service",
      availableLanguage: "Spanish"
    }
  };

  return JSON.stringify(jsonLd);
}

/**
 * Genera un objeto JSON-LD para el sitio web (para mejorar la representación en búsquedas)
 */
export function generateWebsiteJsonLd(): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SEO.site_name,
    url: DEFAULT_SEO.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DEFAULT_SEO.url}/listings?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return JSON.stringify(jsonLd);
}