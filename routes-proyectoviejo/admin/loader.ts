import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db.server";
import { UserModel } from "~/models/User.server";
import { ListingModel } from "~/models/Listing.server";

// Define helper types
interface AdminUser {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface ListingFilters {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  // ========================================
  // OBTENER USUARIO DEL MIDDLEWARE
  // ========================================
  const adminUser = context.adminUser as AdminUser;
  const isSuperAdmin = context.isSuperAdmin;
  
  // ========================================
  // CARGA PRIORITARIA: ESTADÍSTICAS BÁSICAS
  // ========================================
  const basicStatsPromise = Promise.all([
    db.collection('listings').countDocuments(),
    db.collection('creditApplications').countDocuments(),
    db.collection('creditApplications').countDocuments({ status: 'pending' })
  ]);

  // ========================================
  // CARGA DIFERIDA: DATOS DETALLADOS (solo si es superadmin)
  // ========================================
  const detailedDataPromise = isSuperAdmin ? Promise.all([
    UserModel.findAll({ limit: 20, skip: 0 }),
    db.collection('users').countDocuments({ isActive: true }),
    db.collection('users').countDocuments({ role: { $in: ['admin', 'superadmin'] } })
  ]) : Promise.resolve([[], 0, 0]);

  // ========================================
  // CARGA CONDICIONAL: LISTINGS RECIENTES
  // ========================================
  // Usar parámetros compatibles con la interfaz existente
  const recentListingsPromise = ListingModel.findMany({ 
    limit: 10
    // La ordenación se maneja internamente o mediante otro método
  });

  // ========================================
  // RESOLVER PROMESAS EN PARALELO
  // ========================================
  const [
    [totalListings, totalCreditApplications, pendingCreditApplications],
    [users, totalUsers, totalAdmins],
    recentListings
  ] = await Promise.all([
    basicStatsPromise,
    detailedDataPromise,
    recentListingsPromise
  ]);

  // ========================================
  // ESTRUCTURA DE RESPUESTA OPTIMIZADA
  // ========================================
  const responseData = {
    // Datos críticos (siempre incluidos)
    stats: {
      totalListings,
      totalCreditApplications,
      pendingCreditApplications,
      ...(isSuperAdmin ? {
        totalUsers,
        totalAdmins
      } : null)
    },
    
    // Datos de usuario y permisos
    currentUser: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      permissions: context.userPermissions
    },
    
    // Datos condicionales
    ...(isSuperAdmin ? { users } : null),
    recentListings: recentListings.slice(0, 5), // Solo 5 para carga inicial
    
    // Metadatos para lazy loading
    meta: {
      hasMoreListings: recentListings.length > 5,
      hasMoreUsers: isSuperAdmin && Array.isArray(users) && users.length === 20,
      lastUpdated: new Date().toISOString()
    }
  };

  // ========================================
  // HEADERS DE CACHE OPTIMIZADOS
  // ========================================
  return json(responseData, {
    headers: {
      'Cache-Control': 'private, max-age=60', // Cache 1 minuto
      'Vary': 'Authorization',
      'X-Dashboard-Version': '2.0'
    }
  });
}