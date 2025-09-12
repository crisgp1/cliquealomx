// Clerk configuration
export const clerkConfig = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/',
  afterSignUpUrl: '/',
  // Add domain configuration for better routing
  domain: process.env.CLERK_DOMAIN || 'localhost:3000',
  isSatellite: false,
  // Improve error handling
  telemetry: {
    disabled: process.env.NODE_ENV === 'development'
  }
}

// Validate required environment variables with better error messages
if (!process.env.CLERK_PUBLISHABLE_KEY) {
  console.error('❌ Missing CLERK_PUBLISHABLE_KEY environment variable')
  console.error('Please add CLERK_PUBLISHABLE_KEY to your .env file')
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ Missing CLERK_SECRET_KEY environment variable')
  console.error('Please add CLERK_SECRET_KEY to your .env file')
}

// Only throw in production to prevent development crashes
if (process.env.NODE_ENV === 'production') {
  if (!clerkConfig.publishableKey) {
    throw new Error('Missing CLERK_PUBLISHABLE_KEY environment variable')
  }

  if (!clerkConfig.secretKey) {
    throw new Error('Missing CLERK_SECRET_KEY environment variable')
  }
}