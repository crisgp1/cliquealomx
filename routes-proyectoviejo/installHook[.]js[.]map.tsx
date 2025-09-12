import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  // Return a 404 for the Clerk development source map file
  // This is a development-only file that's not needed in production
  return new Response("Not Found", {
    status: 404,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}