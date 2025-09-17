/**
 * Converts a DigitalOcean Spaces URL to a CDN URL or proxied URL
 * to avoid CORS issues
 */
export function getProxiedImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';

  // Check if it's a DigitalOcean Spaces URL
  if (!originalUrl.includes('cliquealo-blob.sfo3.digitaloceanspaces.com')) {
    return originalUrl; // Return as-is if not a DO Spaces URL
  }

  try {
    // First, try to use the CDN URL format which might have better CORS support
    const cdnUrl = originalUrl.replace(
      'https://cliquealo-blob.sfo3.digitaloceanspaces.com',
      'https://cliquealo-blob.sfo3.cdn.digitaloceanspaces.com'
    );

    // For development, still try to use proxy if available
    if (process.env.NODE_ENV === 'development') {
      const url = new URL(originalUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);

      if (pathParts.length >= 3) {
        const folder = pathParts[0]; // e.g., "cars"
        const subfolder = pathParts[1]; // e.g., "68c5ae66bebdeef999f65532"
        const filename = pathParts[2]; // e.g., "image.jpg"

        // Get the API URL from environment variables
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Return the proxied URL for development
        return `${apiUrl}/upload/proxy/${folder}/${subfolder}/${filename}`;
      }
    }

    // Return CDN URL for production or as fallback
    return cdnUrl;
  } catch (error) {
    console.error('Error converting URL to proxied format:', error);
    return originalUrl; // Fallback to original URL
  }
}

/**
 * Converts an array of DigitalOcean Spaces URLs to proxied URLs
 */
export function getProxiedImageUrls(urls: string[]): string[] {
  return urls.map(getProxiedImageUrl);
}