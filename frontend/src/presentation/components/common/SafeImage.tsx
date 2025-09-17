'use client';

import { useState, useCallback } from 'react';
import { IconPhoto, IconAlertCircle } from '@tabler/icons-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function SafeImage({ src, alt, className = '', onError }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failedUrls] = useState(new Set<string>());

  const getFallbackUrls = useCallback((originalUrl: string): string[] => {
    const fallbacks: string[] = [];

    if (originalUrl.includes('cliquealo-blob.sfo3.digitaloceanspaces.com')) {
      // Try CDN version
      const cdnUrl = originalUrl.replace(
        'https://cliquealo-blob.sfo3.digitaloceanspaces.com',
        'https://cliquealo-blob.sfo3.cdn.digitaloceanspaces.com'
      );
      fallbacks.push(cdnUrl);

      // Try without CORS (might work in some cases)
      fallbacks.push(originalUrl);

      // Try with different protocol (as last resort)
      if (originalUrl.startsWith('https://')) {
        fallbacks.push(originalUrl.replace('https://', 'http://'));
      }
    }

    return fallbacks.filter(url => !failedUrls.has(url));
  }, [failedUrls]);

  const handleError = useCallback(() => {
    failedUrls.add(currentSrc);

    const fallbacks = getFallbackUrls(src);
    const nextUrl = fallbacks.find(url => !failedUrls.has(url));

    if (nextUrl) {
      console.log(`Trying fallback URL: ${nextUrl}`);
      setCurrentSrc(nextUrl);
      setIsLoading(true);
    } else {
      console.warn(`All fallback URLs failed for: ${src}`);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  }, [currentSrc, src, failedUrls, getFallbackUrls, onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <IconAlertCircle size={24} className="mx-auto mb-2" />
          <p className="text-xs">Error al cargar imagen</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <IconPhoto size={24} className="text-gray-400 mx-auto mb-1" />
            <div className="text-xs text-gray-500">Cargando...</div>
          </div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
}