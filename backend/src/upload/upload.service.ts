import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
const sharp = require('sharp');
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadService {
  private s3: S3;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('DO_SPACES_BUCKET') || '';
    this.region = this.configService.get<string>('DO_SPACES_REGION') || '';
    this.endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT') || '';

    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('DO_SPACES_KEY'),
      secretAccessKey: this.configService.get<string>('DO_SPACES_SECRET'),
      endpoint: this.endpoint,
      region: this.region,
      s3ForcePathStyle: false,
      signatureVersion: 'v4',
    });
  }

  async uploadCarImages(
    files: Express.Multer.File[],
    carId: string,
  ): Promise<{
    images: UploadResult[];
    thumbnails: UploadResult[];
  }> {
    console.log('🖼️ Uploading', files.length, 'images for car:', carId);

    const images: UploadResult[] = [];
    const thumbnails: UploadResult[] = [];

    for (const file of files) {
      try {
        // Generar nombre único para el archivo
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const key = `cars/${carId}/${fileName}`;
        const thumbKey = `cars/${carId}/thumbs/${fileName}`;

        // Procesar imagen original (redimensionar si es muy grande)
        const processedImage = await sharp(file.buffer)
          .resize(1200, 800, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Crear thumbnail
        const thumbnail = await sharp(file.buffer)
          .resize(300, 200, { 
            fit: 'cover' 
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Subir imagen original
        const uploadParams = {
          Bucket: this.bucketName,
          Key: key,
          Body: processedImage,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
          Metadata: {
            originalName: file.originalname,
            carId: carId,
            uploadedAt: new Date().toISOString(),
          },
        };

        const uploadResult = await this.s3.upload(uploadParams).promise();
        console.log('✅ Image uploaded:', uploadResult.Location);

        images.push({
          url: uploadResult.Location,
          key: key,
          originalName: file.originalname,
          size: processedImage.length,
          mimeType: 'image/jpeg',
        });

        // Subir thumbnail
        const thumbParams = {
          Bucket: this.bucketName,
          Key: thumbKey,
          Body: thumbnail,
          ContentType: 'image/jpeg',
          ACL: 'public-read',
          Metadata: {
            originalName: file.originalname,
            carId: carId,
            type: 'thumbnail',
            uploadedAt: new Date().toISOString(),
          },
        };

        const thumbResult = await this.s3.upload(thumbParams).promise();
        console.log('✅ Thumbnail uploaded:', thumbResult.Location);

        thumbnails.push({
          url: thumbResult.Location,
          key: thumbKey,
          originalName: file.originalname,
          size: thumbnail.length,
          mimeType: 'image/jpeg',
        });

      } catch (error) {
        console.error('❌ Error uploading image:', file.originalname, error);
        throw new Error(`Failed to upload image: ${file.originalname}`);
      }
    }

    console.log('🎉 All images uploaded successfully for car:', carId);
    return { images, thumbnails };
  }

  async uploadHeroMedia(
    files: Express.Multer.File[],
    heroContentId: string,
  ): Promise<{
    mediaFiles: UploadResult[];
  }> {
    console.log('🎬 Uploading', files.length, 'media files for hero content:', heroContentId);

    const mediaFiles: UploadResult[] = [];

    for (const file of files) {
      try {
        // Generar nombre único para el archivo
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const key = `hero-content/${heroContentId}/${fileName}`;

        let processedBuffer = file.buffer;
        let contentType = file.mimetype;

        // Procesar según el tipo de archivo
        if (file.mimetype.startsWith('image/')) {
          // Procesar imagen
          processedBuffer = await sharp(file.buffer)
            .resize(1920, 1080, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 90 })
            .toBuffer();
          contentType = 'image/jpeg';
        }
        // Para videos, usar el archivo original sin procesamiento

        // Subir archivo
        const uploadParams = {
          Bucket: this.bucketName,
          Key: key,
          Body: processedBuffer,
          ContentType: contentType,
          ACL: 'public-read',
          Metadata: {
            originalName: file.originalname,
            heroContentId: heroContentId,
            type: file.mimetype.startsWith('image/') ? 'image' : 'video',
            uploadedAt: new Date().toISOString(),
          },
        };

        const uploadResult = await this.s3.upload(uploadParams).promise();
        console.log('✅ Media uploaded:', uploadResult.Location);

        mediaFiles.push({
          url: uploadResult.Location,
          key: key,
          originalName: file.originalname,
          size: processedBuffer.length,
          mimeType: contentType,
        });

      } catch (error) {
        console.error('❌ Error uploading media:', file.originalname, error);
        throw new Error(`Failed to upload media: ${file.originalname}`);
      }
    }

    console.log('🎉 All media files uploaded successfully for hero content:', heroContentId);
    return { mediaFiles };
  }

  async deleteCarImages(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const deleteParams = {
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    };

    try {
      const result = await this.s3.deleteObjects(deleteParams).promise();
      console.log('🗑️ Images deleted:', result.Deleted?.length);
    } catch (error) {
      console.error('❌ Error deleting images:', error);
      throw new Error('Failed to delete images');
    }
  }

  async deleteHeroMedia(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const deleteParams = {
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    };

    try {
      const result = await this.s3.deleteObjects(deleteParams).promise();
      console.log('🗑️ Hero media deleted:', result.Deleted?.length);
    } catch (error) {
      console.error('❌ Error deleting hero media:', error);
      throw new Error('Failed to delete hero media');
    }
  }
}