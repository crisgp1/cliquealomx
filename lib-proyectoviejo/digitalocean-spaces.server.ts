import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

interface UploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Upload a file to DigitalOcean Spaces
 * @param fileBuffer - The file buffer to upload
 * @param folder - The folder to upload to (optional)
 * @returns Promise with upload response
 */
export async function uploadImage(
  fileBuffer: Buffer,
  folder = "car-listings"
): Promise<UploadResult> {
  return uploadMedia(fileBuffer, folder);
}

export async function uploadMedia(
  fileBuffer: Buffer,
  folder = "car-listings"
): Promise<UploadResult> {
  try {
    const fileName = `${folder}/${randomUUID()}.jpg`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: fileName,
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: 'image/jpeg',
    });

    const result = await s3Client.send(uploadCommand);
    // Para DigitalOcean Spaces, la URL pública usa el formato: https://bucket-name.region.digitaloceanspaces.com/path
    const publicUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;
    
    return {
      secure_url: publicUrl,
      public_id: fileName,
    };
  } catch (error) {
    console.error("Error uploading to DigitalOcean Spaces:", error);
    throw error;
  }
}

interface UploadToSpacesOptions {
  folder?: string;
  publicId?: string;
  contentType?: string;
}

interface UploadToSpacesResult {
  url: string;
  key: string;
}

/**
 * Upload to DigitalOcean Spaces with more flexibility
 * @param fileBuffer - The file buffer to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadToSpaces(
  fileBuffer: Buffer,
  options: UploadToSpacesOptions = {}
): Promise<UploadToSpacesResult> {
  try {
    const { folder = "car-listings", publicId, contentType = 'image/jpeg' } = options;
    const fileName = publicId ? `${folder}/${publicId}` : `${folder}/${randomUUID()}.jpg`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: fileName,
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: contentType,
    });

    console.log(`🌊 Uploading to DigitalOcean Spaces: ${fileName}`);
    const result = await s3Client.send(uploadCommand);
    
    // Para DigitalOcean Spaces, la URL pública usa el formato: https://bucket-name.region.digitaloceanspaces.com/path
    const publicUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;
    console.log(`✅ Upload successful: ${publicUrl}`);
    
    return {
      url: publicUrl,
      key: fileName,
    };
  } catch (error) {
    console.error("❌ Error en upload a DigitalOcean Spaces:", error);
    throw error;
  }
}

/**
 * Upload multiple images to DigitalOcean Spaces
 * @param fileBuffers - Array of file buffers to upload
 * @param folder - The folder to upload to (optional)
 * @returns Promise with array of image URLs
 */
export async function uploadMultipleImages(
  fileBuffers: Buffer[],
  folder = "car-listings"
): Promise<string[]> {
  try {
    const uploadPromises = fileBuffers.map((buffer) => uploadImage(buffer, folder));
    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.secure_url);
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
}

/**
 * Delete an image from DigitalOcean Spaces by URL or key
 * @param publicIdOrUrl - The key or URL of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteImage(publicIdOrUrl: string): Promise<any> {
  try {
    let key = publicIdOrUrl;
    
    // If URL is provided, extract key from URL
    if (publicIdOrUrl.startsWith("http")) {
      const url = new URL(publicIdOrUrl);
      // Remove leading slash
      key = url.pathname.substring(1);
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET!,
      Key: key,
    });

    return await s3Client.send(deleteCommand);
  } catch (error) {
    console.error("Error deleting image from DigitalOcean Spaces:", error);
    throw error;
  }
}