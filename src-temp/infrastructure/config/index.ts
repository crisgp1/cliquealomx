export * from './auth.config';
export * from './database.config';
export * from './storage.config';
export * from './services.config';

// Main configuration validation
export const validateEnvironment = () => {
  const requiredVars = [
    'MONGODB_URI',
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  console.log('✅ Environment configuration validated successfully');
};