import React, { Suspense } from 'react';
import { useLoaderData } from '@remix-run/react';
import { motion } from 'framer-motion';
import type { loader } from './loader';

// ========================================
// TIPOS PARA PROPS DE COMPONENTES
// ========================================
interface StatsWidgetProps {
  stats: {
    totalListings: number;
    totalCreditApplications: number;
    pendingCreditApplications: number;
    totalUsers?: number;
    totalAdmins?: number;
  };
  isSuperAdmin: boolean;
}

interface ListingsTableProps {
  listings: any[];
  hasMore: boolean;
}

// ========================================
// LAZY IMPORTS DE WIDGETS
// ========================================
// Usando lazy imports con tipos explícitos para evitar errores
const StatsWidget = React.lazy(() => 
  Promise.resolve({
    default: (props: StatsWidgetProps) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">{props.stats.totalListings}</p>
            </div>
          </div>
        </div>
        {/* Solo renderiza los stats de admin si el usuario es superadmin */}
        {props.isSuperAdmin && props.stats.totalUsers !== undefined && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{props.stats.totalUsers}</p>
              </div>
            </div>
          </div>
        )}
        {/* Resto de stats similares */}
      </div>
    )
  })
);

const ListingsTable = React.lazy(() =>
  Promise.resolve({
    default: (props: ListingsTableProps) => (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Listings Recientes</h3>
        </div>
        <div className="p-6">
          {props.listings.length > 0 ? (
            <div className="space-y-3">
              {props.listings.map((listing: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{listing.title || 'Listing sin título'}</p>
                </div>
              ))}
              {props.hasMore && (
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Ver más listings...
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No hay listings para mostrar</p>
          )}
        </div>
      </div>
    )
  })
);

const CreditApplicationsWidget = React.lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Aplicaciones de Crédito</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500">No hay aplicaciones pendientes</p>
        </div>
      </div>
    )
  })
);

const AnalyticsChart = React.lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Estadísticas</h3>
        </div>
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
            <p className="text-gray-500">Gráfico de estadísticas</p>
          </div>
        </div>
      </div>
    )
  })
);

const TicketCatalog = React.lazy(() =>
  import('~/components/ui/ticket-catalog').then(module => ({
    default: module.TicketCatalog
  }))
);

// ========================================
// SKELETONS DE CARGA
// ========================================
import { 
  StatsSkeleton,
  TableSkeleton,
  ChartSkeleton,
  WidgetSkeleton 
} from '~/components/admin/skeletons';

// ========================================
// ERROR BOUNDARY COMPONENT
// ========================================
function ErrorBoundary({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const errorHandler = () => setHasError(true);
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  
  if (hasError) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export function AdminDashboard() {
  const data = useLoaderData<typeof loader>();
  const { stats, currentUser, recentListings = [], users = [], meta = {} } = data;
  const isSuperAdmin = currentUser.role === 'superadmin';

  return (
    <motion.div 
      className="admin-dashboard min-h-screen bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ========================================
            HEADER CON TICKET CATALOG LAZY
            ======================================== */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Gestiona usuarios y listings de la plataforma
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <ErrorBoundary fallback={<div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />}>
                <Suspense fallback={<WidgetSkeleton height="h-10" />}>
                  <TicketCatalog />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* ========================================
            STATS GRID - CARGA PRIORITARIA
            ======================================== */}
        <ErrorBoundary fallback="Error al cargar estadísticas">
          <Suspense fallback={<StatsSkeleton />}>
            <StatsWidget 
              stats={{
                totalListings: stats.totalListings || 0,
                totalCreditApplications: stats.totalCreditApplications || 0,
                pendingCreditApplications: stats.pendingCreditApplications || 0,
                totalUsers: isSuperAdmin ? stats.totalUsers as number : undefined,
                totalAdmins: isSuperAdmin ? stats.totalAdmins as number : undefined
              }} 
              isSuperAdmin={isSuperAdmin} 
            />
          </Suspense>
        </ErrorBoundary>

        {/* ========================================
            CONTENIDO PRINCIPAL - CARGA DIFERIDA
            ======================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          
          {/* LISTINGS TABLE - Columna principal */}
          <div className="lg:col-span-2">
            <ErrorBoundary fallback="Error al cargar tabla de listings">
              <Suspense fallback={<TableSkeleton />}>
                <ListingsTable
                  listings={Array.isArray(recentListings) ? recentListings : []}
                  hasMore={Boolean(meta.hasMoreListings)}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* SIDEBAR CON WIDGETS ADICIONALES */}
          <div className="space-y-6">
            
            {/* Credit Applications Widget */}
            <ErrorBoundary fallback="Error al cargar aplicaciones de crédito">
              <Suspense fallback={<WidgetSkeleton height="h-64" />}>
                <CreditApplicationsWidget />
              </Suspense>
            </ErrorBoundary>

            {/* Analytics Chart - Carga con mayor retraso */}
            <ErrorBoundary fallback="Error al cargar analytics">
              <Suspense fallback={<ChartSkeleton />}>
                <AnalyticsChart />
              </Suspense>
            </ErrorBoundary>
            
          </div>
        </div>

        {/* ========================================
            SECCIÓN DE USUARIOS (solo superadmin)
            ======================================== */}
        {isSuperAdmin && (
          <div className="mt-8">
            <ErrorBoundary fallback="Error al cargar gestión de usuarios">
              <Suspense fallback={<TableSkeleton />}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Gestión de Usuarios
                  </h2>
                  {/* Tabla de usuarios lazy */}
                  {Array.isArray(users) && users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((user: any, index: number) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-600">{user.role}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No hay usuarios para mostrar</p>
                  )}
                </div>
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </motion.div>
  );
}