import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * This route handles requests to /.well-known/* paths.
 * It's renamed to dot-well-known to work with Remix's file-based routing.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  
  // Rewrite the path to handle .well-known requests
  if (url.pathname.startsWith('/.well-known/')) {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  // For any other path, return 404
  return new Response("Not found", { status: 404 });
}

/**
 * No UI needed for this route
 */
export default function WellKnown() {
  return null;
}