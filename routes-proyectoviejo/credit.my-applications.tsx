import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import { useLoaderData, Link } from "@remix-run/react"
import { CreditApplicationModel } from "~/models/CreditApplication.server"
import { requireClerkUser } from "~/lib/auth-clerk.server"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  DollarSign,
  Calendar,
  Car
} from "lucide-react"

// Función para traducir motivos de rechazo
const getRejectionReasonLabel = (reason: string) => {
  const translations = {
    'insufficient_income': 'Ingresos insuficientes',
    'poor_credit_history': 'Historial crediticio deficiente',
    'incomplete_documentation': 'Documentación incompleta',
    'high_debt_ratio': 'Relación deuda-ingreso muy alta',
    'employment_instability': 'Inestabilidad laboral',
    'other': 'Otro motivo'
  }
  return translations[reason as keyof typeof translations] || reason
}

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkUser(args)
  
  const applications = await CreditApplicationModel.findByClerkId(user.clerkId!)
  
  return json({ applications, userId: user.clerkId })
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock
  },
  under_review: {
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800",
    icon: Eye
  },
  approved: {
    label: "Aprobado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle
  },
  rejected: {
    label: "Rechazado",
    color: "bg-red-100 text-red-800",
    icon: XCircle
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle
  }
}

export default function MyApplications() {
  const { applications, userId } = useLoaderData<typeof loader>()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mis Solicitudes de Crédito
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona y da seguimiento a tus solicitudes de financiamiento
              </p>
            </div>
            <Link to="/credit/apply">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </Link>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tienes solicitudes de crédito
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza tu proceso de financiamiento creando tu primera solicitud
            </p>
            <Link to="/credit/apply">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Solicitud
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => {
              const status = statusConfig[application.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              
              return (
                <Card key={application._id?.toString()} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Solicitud #{application._id?.toString().slice(-6).toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Creada el {formatDate(application.createdAt.toString())}
                        </p>
                      </div>
                    </div>
                    
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Vehicle Info */}
                  {application.listing && application.listing.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Car className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">Vehículo:</span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {application.listing[0].brand} {application.listing[0].model} {application.listing[0].year}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(application.listing[0].price)}
                      </p>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Monto Solicitado</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(application.financialInfo.requestedAmount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Enganche</p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(application.financialInfo.downPayment)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500">Plazo</p>
                        <p className="text-sm font-semibold">
                          {application.financialInfo.preferredTerm} meses
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Approval Info */}
                  {application.status === 'approved' && application.reviewInfo && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">
                        ¡Felicidades! Tu solicitud ha sido aprobada
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-green-700">Monto Aprobado: </span>
                          <span className="font-semibold">
                            {formatCurrency(application.reviewInfo.approvedAmount || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-700">Pago Mensual: </span>
                          <span className="font-semibold">
                            {formatCurrency(application.reviewInfo.monthlyPayment || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-700">Tasa de Interés: </span>
                          <span className="font-semibold">
                            {application.reviewInfo.interestRate}% anual
                          </span>
                        </div>
                        <div>
                          <span className="text-green-700">Plazo Aprobado: </span>
                          <span className="font-semibold">
                            {application.reviewInfo.approvedTerm} meses
                          </span>
                        </div>
                      </div>
                      {application.reviewInfo.comments && (
                        <div className="mt-3">
                          <span className="text-green-700">Comentarios: </span>
                          <p className="text-green-800 mt-1">{application.reviewInfo.comments}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Info */}
                  {application.status === 'rejected' && application.reviewInfo && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">
                        Solicitud no aprobada
                      </h4>
                      {application.reviewInfo.rejectionReason && (
                        <p className="text-red-800 text-sm">
                         <span className="font-medium">Motivo: </span>
                          {getRejectionReasonLabel(application.reviewInfo.rejectionReason)}
                        </p>
                      )}
                      {application.reviewInfo.comments && (
                        <p className="text-red-800 text-sm mt-2">
                          <span className="font-medium">Comentarios: </span>
                          {application.reviewInfo.comments}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {application.documents.length} documento(s) subido(s)
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link to={`/credit/application/${application._id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </Link>
                      
                      {application.status === 'pending' && (
                        <Link to={`/credit/application/${application._id}/edit`}>
                          <Button size="sm">
                            Editar
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}