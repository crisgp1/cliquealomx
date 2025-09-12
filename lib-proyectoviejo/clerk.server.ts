import { createClerkClient } from '@clerk/remix/api.server'

// Better error handling for development vs production
const validateClerkConfig = () => {
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY
  const hasPublishableKey = !!process.env.CLERK_PUBLISHABLE_KEY

  if (!hasSecretKey) {
    console.error('❌ Missing CLERK_SECRET_KEY environment variable')
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing CLERK_SECRET_KEY environment variable')
    }
  }

  if (!hasPublishableKey) {
    console.error('❌ Missing CLERK_PUBLISHABLE_KEY environment variable')
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing CLERK_PUBLISHABLE_KEY environment variable')
    }
  }

  return hasSecretKey && hasPublishableKey
}

const isConfigured = validateClerkConfig()

// Only create client if properly configured
export const clerkClient = isConfigured ? createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  // Add additional configuration for better error handling
  telemetry: {
    disabled: process.env.NODE_ENV === 'development'
  }
}) : null

// Helper function to check if Clerk is properly configured
export function isClerkConfigured(): boolean {
  return isConfigured
}

// Helper function to safely use clerk client
export function getClerkClient() {
  if (!clerkClient) {
    throw new Error('Clerk is not properly configured. Please check your environment variables.')
  }
  return clerkClient
}