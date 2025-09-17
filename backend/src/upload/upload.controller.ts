import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFiles,
  UseInterceptors,
  Body,
  BadRequestException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService, UploadResult } from './upload.service';
import { ListingsService } from '../listings/listings.service';

@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly listingsService: ListingsService,
  ) {}

  @Post('car-images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 10, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      // Validar tipo de archivo
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes (JPG, PNG, WebP)'), false);
      }
      cb(null, true);
    },
  }))
  async uploadCarImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('carId') carId: string,
  ): Promise<{
    success: boolean;
    images: UploadResult[];
    thumbnails: UploadResult[];
    message: string;
  }> {
    console.log('📤 Received upload request for car:', carId);
    console.log('📎 Files received:', files?.length || 0);

    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron archivos');
    }

    if (!carId) {
      throw new BadRequestException('carId es requerido');
    }

    // Validar número máximo de archivos
    if (files.length > 10) {
      throw new BadRequestException('Máximo 10 imágenes permitidas');
    }

    try {
      const result = await this.uploadService.uploadCarImages(files, carId);

      // Actualizar el listing con las URLs de las imágenes
      const imageUrls = result.images.map(img => img.url);
      await this.listingsService.updateImages(carId, imageUrls);
      console.log('✅ Listing updated with', imageUrls.length, 'images');

      return {
        success: true,
        images: result.images,
        thumbnails: result.thumbnails,
        message: `${files.length} imagen(es) subidas exitosamente`,
      };
    } catch (error) {
      console.error('❌ Error in upload controller:', error);
      throw new BadRequestException(
        error.message || 'Error al procesar las imágenes'
      );
    }
  }

  @Post('hero-media')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('media', 5, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB para videos
    },
    fileFilter: (req, file, cb) => {
      // Validar tipo de archivo (imágenes y videos)
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|mp4|mov|avi|mkv)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes (JPG, PNG, WebP) y videos (MP4, MOV, AVI, MKV)'), false);
      }
      cb(null, true);
    },
  }))
  async uploadHeroMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('heroContentId') heroContentId: string,
  ): Promise<{
    success: boolean;
    mediaFiles: UploadResult[];
    message: string;
  }> {
    console.log('📤 Received hero media upload request for content:', heroContentId);
    console.log('📎 Files received:', files?.length || 0);

    if (!files || files.length === 0) {
      throw new BadRequestException('No se recibieron archivos');
    }

    if (!heroContentId) {
      throw new BadRequestException('heroContentId es requerido');
    }

    // Validar número máximo de archivos
    if (files.length > 5) {
      throw new BadRequestException('Máximo 5 archivos multimedia permitidos');
    }

    try {
      const result = await this.uploadService.uploadHeroMedia(files, heroContentId);

      return {
        success: true,
        mediaFiles: result.mediaFiles,
        message: `${files.length} archivo(s) multimedia subidos exitosamente`,
      };
    } catch (error) {
      console.error('❌ Error in hero media upload controller:', error);
      throw new BadRequestException(
        error.message || 'Error al procesar los archivos multimedia'
      );
    }
  }

  @Get('proxy/:folder/:subfolder/:filename')
  async proxyImage(
    @Param('folder') folder: string,
    @Param('subfolder') subfolder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      const imageUrl = `https://cliquealo-blob.sfo3.digitaloceanspaces.com/${folder}/${subfolder}/${filename}`;

      console.log('🖼️ Proxying image:', imageUrl);

      // Fetch the image from DigitalOcean Spaces
      const response = await fetch(imageUrl);

      if (!response.ok) {
        console.error(`❌ Image not found: ${imageUrl} (Status: ${response.status})`);
        return res.status(404).json({ error: 'Image not found' });
      }

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // Set content type
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);

      // Set cache headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year

      // Stream the image
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));

      console.log('✅ Image proxied successfully');
    } catch (error) {
      console.error('❌ Error proxying image:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  }
}