// app/routes/api.upload-image.ts
// API Enterprise de Upload con Conversión Automática JPG/PNG → WebP
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { processImageToWebP, analyzeImageQuality, type QualityProfile, IMAGE_QUALITY_MATRIX } from "~/lib/webp-converter.server";

// ===============================================
// CONFIGURACIÓN DE TIPOS DE IMAGEN
// ===============================================
const IMAGE_TYPE_MAPPING: Record<string, QualityProfile> = {
  'listing-main': 'ultraHigh', // Imagen principal del listing
  'listing-gallery': 'high', // Galería del carrusel
  'listing-thumbnail': 'thumbnail', // Miniaturas
  'user-avatar': 'medium', // Avatar de usuario
  'hero-banner': 'ultraHigh' // Banners promocionales
} as const;

const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB máximo

// ===============================================
// INTERFAZ DE RESPUESTA ESTRUCTURADA
// ===============================================
interface UploadResponse {
  success: boolean;
  data?: {
    originalUrl: string;
    optimizedUrl: string;
    fallbackUrl: string;
    responsiveUrls: Record<string, string>;
    metadata: {
      originalFormat: string;
      optimizedFormat: string;
      originalSize: number;
      optimizedSize: number;
      compressionRatio: number;
      processingTime: number;
      qualityProfile: QualityProfile;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ===============================================
// HANDLER PRINCIPAL DE UPLOAD
// ===============================================
export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  // Validación de método HTTP
  if (request.method !== "POST") {
    return json<UploadResponse>(
      {
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Solo se permite el método POST'
        }
      },
      { status: 405 }
    );
  }

  const startTime = Date.now();

  try {
    // ===============================================
    // EXTRACCIÓN Y VALIDACIÓN DE DATOS
    // ===============================================
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const imageType = (formData.get("type") as string) || "listing-gallery";
    const forceWebP = formData.get("forceWebP") === "true";
    const customQuality = formData.get("customQuality") as string;
    const fastMode = formData.get("fastMode") !== "false"; // Por defecto activado

    // Validación de archivo
    if (!file) {
      return json<UploadResponse>(
        {
          success: false,
          error: {
            code: 'NO_FILE_PROVIDED',
            message: 'No se proporcionó ningún archivo'
          }
        },
        { status: 400 }
      );
    }

    // Validación de tamaño
    if (file.size > MAX_FILE_SIZE) {
      return json<UploadResponse>(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `El archivo es demasiado grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`
          }
        },
        { status: 400 }
      );
    }

    // Validación de formato
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return json<UploadResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: `Formato no permitido. Formatos válidos: ${ALLOWED_FORMATS.join(', ')}`
          }
        },
        { status: 400 }
      );
    }

    // ===============================================
    // CONVERSIÓN A BUFFER Y ANÁLISIS
    // ===============================================
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    console.log(`📁 Procesando archivo: ${file.name} (${file.type}) - ${(file.size / 1024).toFixed(1)}KB`);

    // Análisis inteligente de la imagen
    const analysis = await analyzeImageQuality(inputBuffer);

    // Determinar perfil de calidad
    let qualityProfile: QualityProfile;
    if (customQuality && customQuality in IMAGE_QUALITY_MATRIX) {
      qualityProfile = customQuality as QualityProfile;
    } else {
      qualityProfile = IMAGE_TYPE_MAPPING[imageType] || analysis.recommendedProfile;
    }

    console.log(`🎯 Perfil de calidad seleccionado: ${qualityProfile}`);
    console.log(`📊 Análisis: ${analysis.analysis.join(', ')}`);

    // ===============================================
    // DECISIÓN DE CONVERSIÓN INTELIGENTE
    // ===============================================
    let shouldConvert = analysis.shouldConvert;

    // Forzar conversión si se solicita explícitamente
    if (forceWebP) {
      shouldConvert = true;
    }

    // No convertir si ya es WebP de alta calidad
    if (file.type === 'image/webp' && !forceWebP) {
      shouldConvert = false;
    }

    if (!shouldConvert) {
      console.log(`⏭️ Omitiendo conversión - imagen ya optimizada`);
      // Para imágenes ya optimizadas, aún necesitamos subirlas a DigitalOcean
      // pero sin conversión
      const { uploadToSpaces } = await import("~/lib/digitalocean-spaces.server");
      const uploadResult = await uploadToSpaces(inputBuffer, {
        folder: `car-listings/${imageType}`,
        publicId: `${Date.now()}_${file.name}`,
        contentType: file.type
      });
      
      return json<UploadResponse>({
        success: true,
        data: {
          originalUrl: uploadResult.url,
          optimizedUrl: uploadResult.url,
          fallbackUrl: uploadResult.url,
          responsiveUrls: {},
          metadata: {
            originalFormat: file.type,
            optimizedFormat: file.type,
            originalSize: file.size,
            optimizedSize: file.size,
            compressionRatio: 0,
            processingTime: Date.now() - startTime,
            qualityProfile
          }
        }
      });
    }

    // ===============================================
    // PROCESAMIENTO Y CONVERSIÓN WEBP
    // ===============================================
    console.log(`🔄 Iniciando conversión WebP con perfil: ${qualityProfile}${fastMode ? ' (modo rápido)' : ''}`);
    const result = await processImageToWebP(inputBuffer, {
      profile: qualityProfile,
      folder: `car-listings/${imageType}`,
      publicId: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
      originalFileName: file.name,
      skipFallback: fastMode
    });

    // ===============================================
    // LOGGING DE RESULTADOS
    // ===============================================
    const totalTime = Date.now() - startTime;
    const compressionRatio = result.metadata.compressionRatio;
    console.log(`✅ Conversión completada en ${totalTime}ms`);
    console.log(`💾 Ahorro de espacio: ${compressionRatio}%`);
    console.log(`🌐 URL WebP: ${result.urls.webp}`);

    // ===============================================
    // RESPUESTA ESTRUCTURADA
    // ===============================================
    const response: UploadResponse = {
      success: true,
      data: {
        originalUrl: result.urls.fallback,
        optimizedUrl: result.urls.webp,
        fallbackUrl: result.urls.fallback,
        responsiveUrls: result.urls.responsive,
        metadata: {
          originalFormat: file.type,
          optimizedFormat: 'image/webp',
          originalSize: file.size,
          optimizedSize: result.metadata.originalSize - (result.metadata.originalSize * result.metadata.compressionRatio / 100),
          compressionRatio: result.metadata.compressionRatio,
          processingTime: totalTime,
          qualityProfile
        }
      }
    };

    return json(response, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Processing-Time': totalTime.toString(),
        'X-Compression-Ratio': compressionRatio.toString()
      }
    });
  } catch (error) {
    // ===============================================
    // MANEJO ROBUSTO DE ERRORES
    // ===============================================
    console.error('❌ Error en procesamiento de imagen:', error);
    const errorResponse: UploadResponse = {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Error interno durante el procesamiento de la imagen',
        details: process.env.NODE_ENV === 'development'
          ? {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            }
          : undefined
      }
    };

    return json(errorResponse, {
      status: 500,
      headers: {
        'X-Error-Time': (Date.now() - startTime).toString()
      }
    });
  }
};

// ===============================================
// UTILIDADES DE VALIDACIÓN
// ===============================================
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No se proporcionó archivo' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB > ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    };
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    return { isValid: false, error: `Formato no soportado: ${file.type}` };
  }

  return { isValid: true };
}

// ===============================================
// MIDDLEWARE DE RATE LIMITING
// ===============================================
const uploadAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000 // 15 minutos
};

export function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = uploadAttempts.get(clientIP);

  if (!clientData) {
    uploadAttempts.set(clientIP, { count: 1, lastAttempt: now });
    return true;
  }

  // Resetear ventana si ha pasado el tiempo
  if (now - clientData.lastAttempt > RATE_LIMIT.windowMs) {
    uploadAttempts.set(clientIP, { count: 1, lastAttempt: now });
    return true;
  }

  // Verificar límite
  if (clientData.count >= RATE_LIMIT.maxAttempts) {
    return false;
  }

  // Incrementar contador
  clientData.count++;
  clientData.lastAttempt = now;
  return true;
}