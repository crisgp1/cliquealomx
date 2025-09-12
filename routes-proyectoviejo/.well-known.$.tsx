import type { LoaderFunctionArgs } from "@remix-run/node";

/**
 * This is a catch-all route handler for various well-known URLs
 * that browsers, dev tools, and other clients may request.
 * 
 * It returns a 200 status with an empty object to avoid 404 errors
 * in the server logs when these requests are made.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Return empty JSON with 200 status
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

/**
 * No UI needed for this route
 */
export default function WellKnown() {
  return null;
}