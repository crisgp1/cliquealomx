import { json } from "@remix-run/node";
import { isClerkConfigured } from "./clerk.server";

export class ClerkError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ClerkError';
  }
}

/**
 * Wrapper for Clerk operations with proper error handling
 */
export async function withClerkErrorHandling<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    if (!isClerkConfigured()) {
      console.warn('⚠️ Clerk is not properly configured, using fallback');
      if (fallback !== undefined) {
        return fallback;
      }
      throw new ClerkError('Clerk is not properly configured');
    }
    
    return await operation();
  } catch (error) {
    console.error('Clerk operation failed:', error);
    
    if (fallback !== undefined) {
      return fallback;
    }
    
    throw error;
  }
}

/**
 * Safe loader wrapper that handles Clerk authentication errors
 */
export function withClerkAuth<T extends Record<string, any>>(
  loader: (args: any) => Promise<Response>
) {
  return async (args: any): Promise<Response> => {
    try {
      return await loader(args);
    } catch (error) {
      console.error('Clerk authentication error in loader:', error);
      
      // Return a safe fallback response
      return json({
        user: null,
        userId: null,
        sessionId: null,
        orgId: null,
        orgRole: null,
        orgSlug: null,
        __clerk_ssr_state: null,
        error: 'Authentication service temporarily unavailable'
      } as unknown as T);
    }
  };
}

/**
 * Check if error is related to Clerk configuration
 */
export function isClerkConfigError(error: any): boolean {
  return error?.message?.includes('CLERK_') || 
         error?.message?.includes('Clerk') ||
         error?.code === 'clerk_config_error';
}

/**
 * Get user-friendly error message for Clerk errors
 */
export function getClerkErrorMessage(error: any): string {
  if (isClerkConfigError(error)) {
    return 'Authentication service is temporarily unavailable. Please try again later.';
  }
  
  if (error?.status === 401) {
    return 'Please sign in to continue.';
  }
  
  if (error?.status === 403) {
    return 'You do not have permission to access this resource.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}