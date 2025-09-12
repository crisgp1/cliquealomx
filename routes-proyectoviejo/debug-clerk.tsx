import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { isClerkConfigured } from "~/lib/clerk.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Only show debug info in development
  if (process.env.NODE_ENV !== 'development') {
    throw new Response("Not Found", { status: 404 });
  }

  const debugInfo = {
    clerkConfigured: isClerkConfigured(),
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    hasPublishableKey: !!process.env.CLERK_PUBLISHABLE_KEY,
    secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...',
    publishableKeyPrefix: process.env.CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV,
    url: request.url,
  };

  return json({ debugInfo });
}

export default function DebugClerk() {
  const { debugInfo } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Clerk Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${debugInfo.clerkConfigured ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Clerk Configured: {debugInfo.clerkConfigured ? 'Yes' : 'No'}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${debugInfo.hasSecretKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Secret Key Present: {debugInfo.hasSecretKey ? 'Yes' : 'No'}</span>
              {debugInfo.hasSecretKey && (
                <span className="text-gray-500 text-sm">({debugInfo.secretKeyPrefix})</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${debugInfo.hasPublishableKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Publishable Key Present: {debugInfo.hasPublishableKey ? 'Yes' : 'No'}</span>
              {debugInfo.hasPublishableKey && (
                <span className="text-gray-500 text-sm">({debugInfo.publishableKeyPrefix})</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Environment: {debugInfo.nodeEnv}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Current URL: {debugInfo.url}</span>
            </div>
          </div>
          
          {!debugInfo.clerkConfigured && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">Configuration Issues</h3>
              <ul className="text-red-700 space-y-1">
                {!debugInfo.hasSecretKey && <li>• Missing CLERK_SECRET_KEY environment variable</li>}
                {!debugInfo.hasPublishableKey && <li>• Missing CLERK_PUBLISHABLE_KEY environment variable</li>}
              </ul>
              <p className="text-red-600 mt-2 text-sm">
                Please check your .env file and ensure both Clerk environment variables are set correctly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}