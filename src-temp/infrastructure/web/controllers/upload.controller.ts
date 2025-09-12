import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  Request,
  Query
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService, UploadResult } from '@application/services/file-upload.service';

interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
  };
}

@Controller('upload')
export class UploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folder?: string; webp?: string },
    @Request() req: AuthenticatedRequest
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    const folder = body.folder || `users/${req.auth.userId}`;
    const generateWebP = body.webp === 'true';

    return await this.fileUploadService.uploadFile(file, folder, generateWebP);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { folder?: string; webp?: string },
    @Request() req: AuthenticatedRequest
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    const folder = body.folder || `users/${req.auth.userId}`;
    const generateWebP = body.webp === 'true';

    return await this.fileUploadService.uploadMultipleFiles(files, folder, generateWebP);
  }

  @Post('car-images')
  @UseInterceptors(FilesInterceptor('images', 20))
  async uploadCarImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { carId: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{
    images: UploadResult[];
    thumbnails: UploadResult[];
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron imágenes');
    }

    if (!body.carId) {
      throw new BadRequestException('carId es requerido');
    }

    // Validate all files are images
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(`${file.originalname} no es una imagen válida`);
      }
    }

    return await this.fileUploadService.uploadCarImages(files, body.carId);
  }

  @Post('responsive-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadResponsiveImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { folder?: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{
    original: UploadResult;
    small: UploadResult;
    medium: UploadResult;
    large: UploadResult;
  }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó imagen');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El archivo debe ser una imagen');
    }

    const folder = body.folder || `users/${req.auth.userId}`;

    return await this.fileUploadService.generateResponsiveImages(file, folder);
  }

  @Post('profile-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadProfileAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    original: UploadResult;
    variants: Record<string, UploadResult>;
  }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó avatar');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('El avatar debe ser una imagen');
    }

    const variants = [
      { name: 'small', width: 50, height: 50, quality: 80, format: 'webp' as const },
      { name: 'medium', width: 100, height: 100, quality: 85, format: 'webp' as const },
      { name: 'large', width: 200, height: 200, quality: 90, format: 'webp' as const }
    ];

    const folder = `users/${req.auth.userId}/avatars`;

    return await this.fileUploadService.uploadImageWithVariants(file, folder, variants);
  }

  @Post('document')
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { 
      folder?: string; 
      type: 'license' | 'insurance' | 'registration' | 'other';
    },
    @Request() req: AuthenticatedRequest
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó documento');
    }

    if (!body.type) {
      throw new BadRequestException('Tipo de documento es requerido');
    }

    // Validate file type for documents
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Use PDF o imágenes');
    }

    const folder = body.folder || `users/${req.auth.userId}/documents/${body.type}`;

    // Convert images to WebP for documents
    const generateWebP = file.mimetype.startsWith('image/');

    return await this.fileUploadService.uploadFile(file, folder, generateWebP);
  }
}