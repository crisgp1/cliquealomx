import { json, type ActionFunctionArgs } from '@remix-run/node';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { processImageToWebP } from '~/lib/webp-converter.server';

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

const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function action(args: ActionFunctionArgs) {
  if (args.request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('📤 Starting document upload process...');
    
    const formData = await args.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ No file provided');
      return json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`📁 Processing file: ${file.name} (${file.type}) - ${(file.size / 1024).toFixed(1)}KB`);

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error(`❌ File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      console.error(`❌ Invalid file type: ${file.type}`);
      return json({ 
        error: `Invalid file type. Allowed types: ${ALLOWED_FORMATS.join(', ')}` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ File converted to buffer: ${buffer.length} bytes`);
    
    let uploadUrl: string;

    // Handle PDFs separately from images
    if (file.type === 'application/pdf') {
      console.log('📄 Processing PDF upload...');
      
      // Upload PDF directly to DigitalOcean Spaces
      const fileName = `documents/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET!,
        Key: fileName,
        Body: buffer,
        ACL: 'public-read',
        ContentType: 'application/pdf',
      });
      
      await s3Client.send(uploadCommand);
      uploadUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;
      
      console.log('✅ PDF uploaded successfully:', uploadUrl);
    } else {
      console.log('🖼️ Processing image upload...');
      
      // Process images with the existing WebP converter
      const result = await processImageToWebP(buffer, {
        profile: 'high',
        folder: 'documents',
        publicId: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
        originalFileName: file.name
      });
      
      uploadUrl = result.urls.webp || result.urls.fallback;
      console.log('✅ Image uploaded successfully:', uploadUrl);
    }

    console.log('🎉 Upload completed successfully');
    
    // Return in the simple format expected by MediaUpload
    return json({
      url: uploadUrl
    });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return json({ 
      error: 'Failed to upload document',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}