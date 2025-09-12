import { json, type ActionFunctionArgs } from '@remix-run/node';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Test Cloudinary connection
    const result = await cloudinary.api.ping();
    
    return json({
      success: true,
      message: 'Cloudinary connection successful',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? 'configured' : 'missing',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'missing'
      },
      ping: result
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? 'configured' : 'missing',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'missing'
      }
    });
  }
}

export async function loader() {
  return json({ message: 'Use POST to test Cloudinary' });
}