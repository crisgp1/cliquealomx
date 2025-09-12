import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Return a simple 1x1 transparent PNG as favicon
  const favicon = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );

  return new Response(favicon, {
    status: 200,
    headers: {
      'Content-Type': 'image/x-icon',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
    },
  });
}