'use client';

import { useState, useEffect } from 'react';
import { SegmentedControl, Center } from '@mantine/core';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { DashboardShell } from '@/presentation/components/dashboard/DashboardShell';

interface AnalyticsData {
  totalViews: number;
  activeListings: number;
  inquiries: number;
  conversionRate: number;
  popularListings: Array<{
    id: string;
    title: string;
    views: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    listingId?: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:3001/listings/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Justo ahora';
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
            <p className="text-muted-foreground">Cargando datos de analíticas...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
            <p className="text-red-500">Error: {error}</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!analytics) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
            <p className="text-muted-foreground">No hay datos de analíticas disponibles</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analíticas</h1>
            <p className="text-muted-foreground">
              Visualiza estadísticas y métricas de rendimiento de tus anuncios
            </p>
          </div>
          
          <SegmentedControl
            value={viewMode}
            onChange={(value) => setViewMode(value as 'cards' | 'list')}
            data={[
              {
                value: 'cards',
                label: (
                  <Center style={{ gap: 8 }}>
                    <IconLayoutGrid size={16} />
                    <span>Tarjetas</span>
                  </Center>
                ),
              },
              {
                value: 'list',
                label: (
                  <Center style={{ gap: 8 }}>
                    <IconList size={16} />
                    <span>Lista</span>
                  </Center>
                ),
              },
            ]}
          />
        </div>
        
        <motion.div 
          className={viewMode === 'cards' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-4" : "space-y-4"}
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {viewMode === 'cards' ? (
            <>
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium">Total de Visitas</h3>
                </div>
                <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  En todos tus anuncios
                </p>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium">Anuncios Activos</h3>
                </div>
                <div className="text-2xl font-bold">{analytics.activeListings}</div>
                <p className="text-xs text-muted-foreground">
                  Actualmente publicados
                </p>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium">Consultas</h3>
                </div>
                <div className="text-2xl font-bold">{analytics.inquiries}</div>
                <p className="text-xs text-muted-foreground">
                  Estimadas de las visitas
                </p>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium">Tasa de Conversión</h3>
                </div>
                <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Proporción de likes por visitas
                </p>
              </motion.div>
            </>
          ) : (
            <motion.div 
              className="rounded-lg border divide-y"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Total de Visitas</h3>
                  <p className="text-xs text-muted-foreground">En todos tus anuncios</p>
                </div>
                <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Anuncios Activos</h3>
                  <p className="text-xs text-muted-foreground">Actualmente publicados</p>
                </div>
                <div className="text-2xl font-bold">{analytics.activeListings}</div>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Consultas</h3>
                  <p className="text-xs text-muted-foreground">Estimadas de las visitas</p>
                </div>
                <div className="text-2xl font-bold">{analytics.inquiries}</div>
              </div>
              
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-medium">Tasa de Conversión</h3>
                  <p className="text-xs text-muted-foreground">Proporción de likes por visitas</p>
                </div>
                <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        <motion.div 
          className={viewMode === 'cards' ? "grid gap-4 md:grid-cols-2" : "space-y-4"}
          layout
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {viewMode === 'cards' ? (
            <>
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <h3 className="text-lg font-medium mb-4">Anuncios Populares</h3>
                <div className="space-y-3">
                  {analytics.popularListings.length > 0 ? (
                    analytics.popularListings.map((listing, index) => (
                      <motion.div 
                        key={listing.id} 
                        className="flex justify-between items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.6 + index * 0.1 }}
                      >
                        <span className="text-sm">{listing.title}</span>
                        <span className="text-sm text-muted-foreground">{listing.views} visitas</span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay anuncios aún</p>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
                <div className="space-y-3">
                  {analytics.recentActivity.length > 0 ? (
                    analytics.recentActivity.map((activity, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.7 + index * 0.1 }}
                      >
                        <span className="text-sm">{activity.description}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                  )}
                </div>
              </motion.div>
            </>
          ) : (
            <div className="space-y-4">
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="text-lg font-medium mb-4">Anuncios Populares</h3>
                <div className="space-y-2">
                  {analytics.popularListings.length > 0 ? (
                    analytics.popularListings.map((listing, index) => (
                      <motion.div 
                        key={listing.id} 
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.2 + index * 0.1 }}
                      >
                        <span className="text-sm font-medium">{listing.title}</span>
                        <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          {listing.views} visitas
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay anuncios aún</p>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                className="rounded-lg border p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
                <div className="space-y-2">
                  {analytics.recentActivity.length > 0 ? (
                    analytics.recentActivity.map((activity, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
                      >
                        <span className="text-sm font-medium">{activity.description}</span>
                        <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  );
}