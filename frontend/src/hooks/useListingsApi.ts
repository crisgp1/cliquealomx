'use client';

import { useMemo } from 'react';
import { ListingsAPI } from '@/lib/api/listings';
import { useAuth } from '@clerk/nextjs';

export function useListingsApi() {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    // Create API instance with auth token injection
    class AuthenticatedListingsAPI extends ListingsAPI {
      async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        try {
          // Get Clerk auth token
          const token = await getToken();
          
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
              ...options.headers,
            },
            ...options,
          });

          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch {
              // Ignore error text parsing failures
            }
            throw new Error(errorMessage);
          }

          return response.json();
        } catch (error) {
          console.error(`API Error [${endpoint}]:`, error);
          throw error;
        }
      }
    }

    return new AuthenticatedListingsAPI();
  }, [getToken]);

  return api;
}