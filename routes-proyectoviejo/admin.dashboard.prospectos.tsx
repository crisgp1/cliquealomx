import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireClerkAdmin } from "~/lib/auth-clerk.server";
import { ProspectModel } from "~/models/Prospect.server";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Phone,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Target
} from "lucide-react";

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkAdmin(args);
  const { request } = args;
  
  const [prospects, stats] = await Promise.all([
    ProspectModel.findAll({ limit: 10 }),
    ProspectModel.getStats()
  ]);
  
  // Get recent prospects (last 7 days)
  const recentProspects = prospects.filter(p => {
    const prospectDate = new Date(p.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return prospectDate >= weekAgo;
  });

  // Calculate conversion metrics
  const conversionRate = stats.total > 0 
    ? ((stats.byStatus.converted || 0) / stats.total * 100).toFixed(1)
    : "0";

  const appointmentRate = stats.total > 0
    ? ((stats.byStatus.appointment_scheduled || 0) / stats.total * 100).toFixed(1)
    : "0";

  return json({
    prospects: prospects.slice(0, 5), // Latest 5
    recentProspects,
    stats,
    metrics: {
      conversionRate,
      appointmentRate
    }
  });
}

export default function ProspectosDashboard() {
  const { prospects, recentProspects, stats, metrics } = useLoaderData<typeof loader>();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      new: { label: "Nuevo", variant: "default" as const },
      contacted: { label: "Contactado", variant: "secondary" as const },
      appointment_scheduled: { label: "Cita Agendada", variant: "outline" as const },
      qualified: { label: "Calificado", variant: "secondary" as const },
      converted: { label: "Convertido", variant: "default" as const },
      not_interested: { label: "No Interesado", variant: "destructive" as const }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Prospectos</h1>
            <p className="text-gray-600">Resumen de leads y actividad reciente</p>
          </div>
        <Button asChild>
          <Link to="/admin/prospectos">
            Ver Todos
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prospectos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold">{recentProspects.length}</p>
                <p className="text-xs text-green-600">+{stats.recent} en 7 días</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Citas</p>
                <p className="text-2xl font-bold">{metrics.appointmentRate}%</p>
                <p className="text-xs text-gray-500">{stats.byStatus.appointment_scheduled || 0} citas</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversión</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                <p className="text-xs text-gray-500">{stats.byStatus.converted || 0} convertidos</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prospects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Prospectos Recientes</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/prospectos">Ver Todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prospects.map((prospect) => (
                <div key={prospect._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{prospect.name}</p>
                      {getStatusBadge(prospect.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {prospect.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(prospect.createdAt)}
                      </span>
                    </div>
                    {prospect.interestedListingTitle && (
                      <p className="text-xs text-blue-600 mt-1">
                        Interés: {prospect.interestedListingTitle}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/prospectos?search=${prospect.phone}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              
              {prospects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay prospectos recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0";
                
                const statusLabels = {
                  new: "Nuevos",
                  contacted: "Contactados", 
                  appointment_scheduled: "Citas Agendadas",
                  qualified: "Calificados",
                  converted: "Convertidos",
                  not_interested: "No Interesados"
                };
                
                const label = statusLabels[status as keyof typeof statusLabels] || status;
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(status)}
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Origen de Prospectos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stats.bySource).map(([source, count]) => {
              const sourceLabels = {
                mercadolibre: "MercadoLibre",
                facebook: "Facebook",
                instagram: "Instagram", 
                whatsapp: "WhatsApp",
                website: "Página Web",
                referral: "Recomendación",
                other: "Otros"
              };
              
              const label = sourceLabels[source as keyof typeof sourceLabels] || source;
              const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : "0";
              
              return (
                <div key={source} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{percentage}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/prospectos">
                <MessageSquare className="h-4 w-4 mr-2" />
                Capturar Nuevo Prospecto
              </Link>
            </Button>
            
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/admin/prospectos?status=new">
                <Users className="h-4 w-4 mr-2" />
                Revisar Nuevos ({stats.byStatus.new || 0})
              </Link>
            </Button>
            
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/admin/prospectos?status=appointment_scheduled">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Citas Agendadas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}