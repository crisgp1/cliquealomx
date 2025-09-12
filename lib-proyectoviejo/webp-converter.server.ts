// app/lib/webp-converter.server.ts
// Sistema Enterprise de Conversión Automática JPG/PNG → WebP
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

// Configure DigitalOcean Spaces (S3-compatible)
const s3Client = new S3Client({
  forcePathStyle: true,
  endpoint: process.env.DO_SPACES_ENDPOINT!,
  region: process.env.DO_SPACES_REGION!,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET!,
  },
});

// ===============================================
// CONFIGURACIÓN OPTIMIZADA DE CALIDAD
// ===============================================
export const IMAGE_QUALITY_MATRIX = {
  // Perfil Ultra-High Quality para imágenes principales
  ultraHigh: {
    webp: {
      quality: 92,
      effort: 4,
      smartSubsample: false
    },
    fallback: {
      quality: 95,
      progressive: true,
      mozjpeg: true
    },
    dimensions: {
      width: 1920,
      height: 1440,
      fit: 'inside' as const
    }
  },
  // Perfil High Quality para carruseles (RECOMENDADO)
  high: {
    webp: {
      quality: 88,
      effort: 4,
      smartSubsample: true
    },
    fallback: {
      quality: 90,
      progressive: true,
      mozjpeg: true
    },
    dimensions: {
      width: 1200,
      height: 900,
      fit: 'inside' as const
    }
  },
  // Perfil Medium Quality para listados
  medium: {
    webp: {
      quality: 82,
      effort: 3,
      smartSubsample: true
    },
    fallback: {
      quality: 85,
      progressive: true,
      mozjpeg: true
    },
    dimensions: {
      width: 800,
      height: 600,
      fit: 'inside' as const
    }
  },
  // Perfil Thumbnail optimizado
  thumbnail: {
    webp: {
      quality: 75,
      effort: 2,
      smartSubsample: true
    },
    fallback: {
      quality: 80,
      progressive: true,
      mozjpeg: true
    },
    dimensions: {
      width: 300,
      height: 200,
      fit: 'cover' as const
    }
  }
} as const;

export type QualityProfile = keyof typeof IMAGE_QUALITY_MATRIX;

// ===============================================
// INTERFAZ DE RESULTADO DE CONVERSIÓN
// ===============================================
export interface ConversionResult {
  webp: {
    buffer: Buffer;
    url?: string;
    size: number;
    quality: number;
  };
  fallback: {
    buffer: Buffer;
    url?: string;
    size: number;
    quality: number;
  };
  metadata: {
    originalFormat: string;
    originalSize: number;
    dimensions: {
      width: number;
      height: number;
    };
    compressionRatio: number;
    processingTime: number;
  };
}

// ===============================================
// FUNCIÓN PRINCIPAL DE CONVERSIÓN
// ===============================================
export async function convertToWebPAutomatically(
  inputBuffer: Buffer,
  profile: QualityProfile = 'high',
  originalFileName?: string,
  skipFallback: boolean = false
): Promise<ConversionResult> {
  const startTime = Date.now();
  const config = IMAGE_QUALITY_MATRIX[profile];
  try {
    // ===============================================
    // ANÁLISIS DE IMAGEN ORIGINAL
    // ===============================================
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalFormat = originalMetadata.format || 'unknown';
    const originalSize = inputBuffer.length;

    // Log de diagnóstico
    console.log(`🔄 Procesando imagen: ${originalFileName || 'unknown'}`);
    console.log(`📊 Original: ${originalFormat.toUpperCase()} - ${(originalSize / 1024).toFixed(1)}KB - ${originalMetadata.width}x${originalMetadata.height}`);

    // ===============================================
    // CONVERSIÓN A WEBP (OPTIMIZADA PARA VELOCIDAD)
    // ===============================================
    const sharpInstance = sharp(inputBuffer)
      // Redimensionamiento inteligente
      .resize(config.dimensions.width, config.dimensions.height, {
        fit: config.dimensions.fit,
        withoutEnlargement: true,
        position: 'center'
      });

    // Solo aplicar sharpening y normalización si es ultra-high quality
    if (profile === 'ultraHigh') {
      sharpInstance
        .sharpen(0.3, 1, 0.3)
        .normalise({ lower: 1, upper: 99 });
    }

    const webpBuffer = await sharpInstance
      .webp({
        quality: config.webp.quality,
        effort: config.webp.effort,
        smartSubsample: config.webp.smartSubsample,
        // Configuraciones optimizadas para velocidad
        nearLossless: false, // Desactivado para mejor velocidad
        preset: 'photo'
      })
      .toBuffer();

    // ===============================================
    // IMAGEN FALLBACK (JPEG OPTIMIZADO - SOLO SI ES NECESARIO)
    // ===============================================
    let fallbackBuffer: Buffer;
    
    if (skipFallback) {
      // Usar WebP como fallback para máxima velocidad
      fallbackBuffer = webpBuffer;
    } else {
      // Solo generar fallback si realmente se necesita (browsers muy antiguos)
      if (profile === 'ultraHigh' || profile === 'high') {
        const fallbackInstance = sharp(inputBuffer)
          .resize(config.dimensions.width, config.dimensions.height, {
            fit: config.dimensions.fit,
            withoutEnlargement: true,
            position: 'center'
          });

        // Solo aplicar optimizaciones pesadas para alta calidad
        if (profile === 'ultraHigh') {
          fallbackInstance
            .sharpen(0.3, 1, 0.3)
            .normalise({ lower: 1, upper: 99 });
        }

        fallbackBuffer = await fallbackInstance
          .jpeg({
            quality: config.fallback.quality,
            progressive: config.fallback.progressive,
            mozjpeg: false, // Desactivar mozjpeg para velocidad
            optimiseScans: false // Simplificar para velocidad
          })
          .toBuffer();
      } else {
        // Para medium y thumbnail, usar WebP como fallback también
        fallbackBuffer = webpBuffer;
      }
    }

    // ===============================================
    // MÉTRICAS DE COMPRESIÓN
    // ===============================================
    const compressionRatio = ((originalSize - webpBuffer.length) / originalSize) * 100;
    const processingTime = Date.now() - startTime;

    // Log de resultados
    console.log(`✅ WebP: ${(webpBuffer.length / 1024).toFixed(1)}KB (${compressionRatio.toFixed(1)}% ahorro)`);
    console.log(`⏱️ Procesamiento: ${processingTime}ms`);

    return {
      webp: {
        buffer: webpBuffer,
        size: webpBuffer.length,
        quality: config.webp.quality
      },
      fallback: {
        buffer: fallbackBuffer,
        size: fallbackBuffer.length,
        quality: config.fallback.quality
      },
      metadata: {
        originalFormat,
        originalSize,
        dimensions: {
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0
        },
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        processingTime
      }
    };
  } catch (error) {
    console.error('❌ Error en conversión WebP:', error);
    throw new Error(`WebP conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===============================================
// UPLOAD OPTIMIZADO A DIGITALOCEAN SPACES
// ===============================================
export async function uploadOptimizedToSpaces(
  conversionResult: ConversionResult,
  folder: string = 'car-listings-optimized',
  publicId?: string
): Promise<{
  webpUrl: string;
  fallbackUrl: string;
  responsiveUrls: Record<string, string>;
}> {
  try {
    const webpFileName = `${folder}/${publicId ? `${publicId}_webp` : randomUUID()}.webp`;
    const fallbackFileName = `${folder}/fallback/${publicId ? `${publicId}_jpg` : randomUUID()}.jpg`;

    // ===============================================
    // UPLOAD WEBP (IMAGEN PRINCIPAL)
    // ===============================================
    const webpCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: webpFileName,
      Body: conversionResult.webp.buffer,
      ACL: 'public-read',
      ContentType: 'image/webp',
    });
    await s3Client.send(webpCommand);
    // Para DigitalOcean Spaces, la URL pública usa el formato: https://bucket-name.region.digitaloceanspaces.com/path
    const webpUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${webpFileName}`;

    // ===============================================
    // UPLOAD FALLBACK (JPEG)
    // ===============================================
    const fallbackCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: fallbackFileName,
      Body: conversionResult.fallback.buffer,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
    });
    await s3Client.send(fallbackCommand);
    // Para DigitalOcean Spaces, la URL pública usa el formato: https://bucket-name.region.digitaloceanspaces.com/path
    const fallbackUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fallbackFileName}`;

    // ===============================================
    // GENERAR URLs RESPONSIVAS
    // ===============================================
    const responsiveUrls = {
      mobile: webpUrl,
      tablet: webpUrl,
      desktop: webpUrl,
      retina: webpUrl
    };

    return {
      webpUrl,
      fallbackUrl,
      responsiveUrls
    };
  } catch (error) {
    console.error('❌ Error en upload a DigitalOcean Spaces:', error);
    throw error;
  }
}

// ===============================================
// FUNCIÓN COMPLETA DE PROCESAMIENTO
// ===============================================
export async function processImageToWebP(
  inputBuffer: Buffer,
  options: {
    profile?: QualityProfile;
    folder?: string;
    publicId?: string;
    originalFileName?: string;
    skipFallback?: boolean;
  } = {}
): Promise<{
  urls: {
    webp: string;
    fallback: string;
    responsive: Record<string, string>;
  };
  metadata: ConversionResult['metadata'];
}> {
  const { profile = 'high', folder = 'car-listings-optimized', publicId, originalFileName, skipFallback = false } = options;

  // Conversión a WebP
  const conversionResult = await convertToWebPAutomatically(
    inputBuffer,
    profile,
    originalFileName,
    skipFallback
  );

  // Upload a DigitalOcean Spaces
  const uploadResult = await uploadOptimizedToSpaces(
    conversionResult,
    folder,
    publicId
  );

  return {
    urls: {
      webp: uploadResult.webpUrl,
      fallback: uploadResult.fallbackUrl,
      responsive: uploadResult.responsiveUrls
    },
    metadata: conversionResult.metadata
  };
}

// ===============================================
// UTILIDADES DE ANÁLISIS
// ===============================================
export async function analyzeImageQuality(buffer: Buffer): Promise<{
  shouldConvert: boolean;
  recommendedProfile: QualityProfile;
  estimatedSavings: string;
  analysis: string[];
}> {
  const metadata = await sharp(buffer).metadata();
  const analysis: string[] = [];
  let recommendedProfile: QualityProfile = 'medium';

  // Análisis de formato
  if (metadata.format === 'png' && !metadata.hasAlpha) {
    analysis.push('PNG sin transparencia detectado - conversión a WebP recomendada');
    recommendedProfile = 'high';
  }

  // Análisis de dimensiones
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (width >= 1200 || height >= 900) {
    analysis.push('Imagen de alta resolución - usar perfil ultra-high');
    recommendedProfile = 'ultraHigh';
  } else if (width <= 400 && height <= 300) {
    analysis.push('Imagen pequeña - usar perfil thumbnail');
    recommendedProfile = 'thumbnail';
  }

  // Análisis de peso
  const sizeKB = buffer.length / 1024;
  if (sizeKB > 500) {
    analysis.push('Imagen pesada detectada - conversión crítica');
  }

  const estimatedSavings = metadata.format === 'png' ? '50-70%' : '30-50%';

  return {
    shouldConvert: metadata.format !== 'webp',
    recommendedProfile,
    estimatedSavings,
    analysis
  };
}