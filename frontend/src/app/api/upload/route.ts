import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const carId = formData.get('carId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    if (!carId) {
      return NextResponse.json({ error: 'Car ID is required' }, { status: 400 });
    }

    const uploadPromises = files.map(async (file, index) => {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `cars/${carId}/${timestamp}-${index}-${file.name}`;

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
      });

      return {
        url: blob.url,
        filename: blob.pathname,
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      count: uploadedImages.length,
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}