import { redirect } from "@remix-run/node";
import { requireAdmin } from "~/lib/auth.server";
import type { DataFunctionArgs } from "@remix-run/node";

// Define admin context interface
// Use module augmentation instead of direct casting
declare global {
  interface AppLoadContext {
    adminUser?: any;
    userPermissions?: string[];
    isSuperAdmin?: boolean;
  }
}

export const middleware = async ({ request, context }: DataFunctionArgs) => {
  // ========================================
  // VERIFICACIÓN RÁPIDA DE AUTENTICACIÓN
  // ========================================
  try {
    const user = await requireAdmin(request);
    
    if (!user) {
      throw redirect("/auth/login?redirect=/admin");
    }

    // ========================================
    // PRELOAD DE DATOS CRÍTICOS
    // ========================================
    // Directly set properties on context object
    context.adminUser = user;
    context.userPermissions = (user as any).permissions || [];
    context.isSuperAdmin = (user as any).role === 'superadmin';
    
    // ========================================
    // CONFIGURACIÓN DE CACHE HEADERS
    // ========================================
    const response = new Response(null, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    return response;
    
  } catch (error) {
    console.error('Admin middleware error:', error);
    throw redirect("/auth/login?error=authentication_required");
  }
};