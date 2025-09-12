import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

@Injectable()
export class FileUploadService {
  private s3: AWS.S3;
  private bucketName: string;
  private region: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('DO_SPACES_BUCKET') || '';
    this.region = this.configService.get<string>('DO_SPACES_REGION') || '';
    this.endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT') || '';

    this.s3 = new AWS.S3({
      endpoint: this.endpoint,
      accessKeyId: this.configService.get<string>('DO_SPACES_KEY'),
      secretAccessKey: this.configService.get<string>('DO_SPACES_SECRET'),
      region: this.region,
      s3ForcePathStyle: false,
      signatureVersion: 'v4'
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    generateWebP: boolean = false
  ): Promise<UploadResult> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${fileName}`;

    let buffer = file.buffer;
    let mimeType = file.mimetype;

    // Convert to WebP if requested and it's an image
    if (generateWebP && this.isImage(file.mimetype)) {
      buffer = await this.convertToWebP(file.buffer);
      mimeType = 'image/webp';
      const webpKey = key.replace(/\.[^/.]+$/, '.webp');
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: webpKey,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
        CacheControl: 'max-age=31536000' // 1 year cache
      };

      const result = await this.s3.upload(uploadParams).promise();

      return {
        url: result.Location,
        key: webpKey,
        originalName: file.originalname,
        size: buffer.length,
        mimeType
      };
    }

    // Regular file upload
    const uploadParams = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read'
    };

    const result = await this.s3.upload(uploadParams).promise();

    return {
      url: result.Location,
      key,
      originalName: file.originalname,
      size: file.size,
      mimeType
    };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
    generateWebP: boolean = false
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, folder, generateWebP)
    );

    return Promise.all(uploadPromises);
  }

  async uploadImageWithVariants(
    file: Express.Multer.File,
    folder: string = 'uploads',
    variants: ImageVariant[] = []
  ): Promise<{
    original: UploadResult;
    variants: Record<string, UploadResult>;
  }> {
    if (!this.isImage(file.mimetype)) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Upload original as WebP
    const original = await this.uploadFile(file, folder, true);

    // Create variants
    const variantResults: Record<string, UploadResult> = {};

    for (const variant of variants) {
      const resizedBuffer = await this.resizeImage(
        file.buffer,
        variant.width,
        variant.height,
        variant.quality || 85,
        variant.format || 'webp'
      );

      const fileName = `${uuidv4()}_${variant.name}.${variant.format || 'webp'}`;
      const key = `${folder}/variants/${fileName}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: resizedBuffer,
        ContentType: `image/${variant.format || 'webp'}`,
        ACL: 'public-read',
        CacheControl: 'max-age=31536000'
      };

      const result = await this.s3.upload(uploadParams).promise();

      variantResults[variant.name] = {
        url: result.Location,
        key,
        originalName: file.originalname,
        size: resizedBuffer.length,
        mimeType: `image/${variant.format || 'webp'}`
      };
    }

    return {
      original,
      variants: variantResults
    };
  }

  async uploadCarImages(
    files: Express.Multer.File[],
    carId: string
  ): Promise<{
    images: UploadResult[];
    thumbnails: UploadResult[];
  }> {
    const folder = `cars/${carId}`;
    
    // Standard variants for car images
    const variants: ImageVariant[] = [
      { name: 'thumbnail', width: 300, height: 200, quality: 80, format: 'webp' },
      { name: 'medium', width: 800, height: 600, quality: 85, format: 'webp' },
      { name: 'large', width: 1200, height: 900, quality: 90, format: 'webp' }
    ];

    const results = await Promise.all(
      files.map(file => this.uploadImageWithVariants(file, folder, variants))
    );

    return {
      images: results.map(r => r.original),
      thumbnails: results.map(r => r.variants.thumbnail)
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async deleteFiles(keys: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      const success = await this.deleteFile(key);
      if (success) {
        deleted.push(key);
      } else {
        failed.push(key);
      }
    }

    return { deleted, failed };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiresIn
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<boolean> {
    try {
      await this.s3.copyObject({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
        ACL: 'public-read'
      }).promise();

      return true;
    } catch (error) {
      console.error('Error copying file:', error);
      return false;
    }
  }

  private async convertToWebP(buffer: Buffer, quality: number = 85): Promise<Buffer> {
    return sharp(buffer)
      .webp({ quality })
      .toBuffer();
  }

  private async resizeImage(
    buffer: Buffer,
    width: number,
    height?: number,
    quality: number = 85,
    format: 'webp' | 'jpeg' | 'png' = 'webp'
  ): Promise<Buffer> {
    let sharpInstance = sharp(buffer);

    if (height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    } else {
      sharpInstance = sharpInstance.resize(width);
    }

    switch (format) {
      case 'webp':
        return sharpInstance.webp({ quality }).toBuffer();
      case 'jpeg':
        return sharpInstance.jpeg({ quality }).toBuffer();
      case 'png':
        return sharpInstance.png({ quality }).toBuffer();
      default:
        return sharpInstance.webp({ quality }).toBuffer();
    }
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  // Utility method to get file info without downloading
  async getFileInfo(key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    etag: string;
  } | null> {
    try {
      const result = await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return {
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType || '',
        etag: result.ETag || ''
      };
    } catch (error) {
      return null;
    }
  }

  // Generate different sizes for responsive images
  async generateResponsiveImages(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<{
    original: UploadResult;
    small: UploadResult;
    medium: UploadResult;
    large: UploadResult;
  }> {
    if (!this.isImage(file.mimetype)) {
      throw new Error('El archivo debe ser una imagen');
    }

    const variants: ImageVariant[] = [
      { name: 'small', width: 400, quality: 75, format: 'webp' },
      { name: 'medium', width: 800, quality: 85, format: 'webp' },
      { name: 'large', width: 1200, quality: 90, format: 'webp' }
    ];

    const result = await this.uploadImageWithVariants(file, folder, variants);

    return {
      original: result.original,
      small: result.variants.small,
      medium: result.variants.medium,
      large: result.variants.large
    };
  }
}