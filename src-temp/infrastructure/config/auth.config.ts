export const authConfig = {
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    jsUrl: process.env.CLERK_JS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
};

export const validateAuthConfig = () => {
  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error('CLERK_PUBLISHABLE_KEY environment variable is required');
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY environment variable is required');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
};