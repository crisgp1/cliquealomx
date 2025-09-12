import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Form, useSubmit } from "@remix-run/react"
import { CreditApplicationModel } from "~/models/CreditApplication.server"
import { requireClerkAdmin } from "~/lib/auth-clerk.server"
import { AdminLayout } from "~/components/admin/AdminLayout"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { toast } from "~/components/ui/toast"
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  Download,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  Users,
  Briefcase,
  Heart,
  FileImage,
  ExternalLink,
  List,
  Grid3X3,
  LayoutGrid
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card as HeroCard,
  CardBody,
  CardHeader,
  Button as HeroButton,
  Chip,
  Divider,
  ButtonGroup,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab
} from "@heroui/react"


// Función para traducir estado civil
const getMaritalStatusLabel = (status: string) => {
  const translations = {
    'single': 'Soltero(a)',
    'married': 'Casado(a)', 
    'divorced': 'Divorciado(a)',
    'widowed': 'Viudo(a)'
  }
  return translations[status as keyof typeof translations] || status
}

// Agregar después de getMaritalStatusLabel
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

// Función para traducir tipo de empleo
const getEmploymentTypeLabel = (type: string) => {
  const translations = {
    'employee': 'Empleado',
    'self_employed': 'Trabajador Independiente',
    'business_owner': 'Empresario',
    'retired': 'Jubilado',
    'unemployed': 'Desempleado'
  }
  return translations[type as keyof typeof translations] || type
}

// Función para traducir tipo de cuenta bancaria
const getAccountTypeLabel = (type: string) => {
  const translations = {
    'checking': 'Cuenta Corriente',
    'savings': 'Cuenta de Ahorros'
  }
  return translations[type as keyof typeof translations] || type
}

// Función para traducir estado de solicitud
const getStatusLabel = (status: string) => {
  const translations = {
    'pending': 'Pendiente',
    'under_review': 'En Revisión',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'cancelled': 'Cancelado'
  }
  return translations[status as keyof typeof translations] || status
}

// Función para traducir tipo de documento
const getDocumentTypeLabel = (type: string) => {
  const translations = {
    'identification': 'Identificación',
    'income_proof': 'Comprobante de Ingresos',
    'address_proof': 'Comprobante de Domicilio',
    'bank_statement': 'Estado de Cuenta',
    'other': 'Otro'
  }
  return translations[type as keyof typeof translations] || type
}

// Función para obtener badge de estado traducido
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Chip
          startContent={<Clock className="w-4 h-4" />}
          variant="flat"
          color="warning"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pendiente
        </Chip>
      )
    case 'under_review':
      return (
        <Chip
          startContent={<Eye className="w-4 h-4" />}
          variant="flat"
          color="primary"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          En Revisión
        </Chip>
      )
    case 'approved':
      return (
        <Chip
          startContent={<CheckCircle className="w-4 h-4" />}
          variant="flat"
          color="success"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Aprobado
        </Chip>
      )
    case 'rejected':
      return (
        <Chip
          startContent={<XCircle className="w-4 h-4" />}
          variant="flat"
          color="danger"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Rechazado
        </Chip>
      )
    case 'cancelled':
      return (
        <Chip
          startContent={<XCircle className="w-4 h-4" />}
          variant="flat"
          color="default"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          Cancelado
        </Chip>
      )
    default:
      return (
        <Chip variant="flat" color="default">
          {getStatusLabel(status)}
        </Chip>
      )
  }
}
export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkAdmin(args)

  const url = new URL(args.request.url)
  const status = url.searchParams.get("status") || undefined
  const search = url.searchParams.get("search") || undefined
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = 20
  const skip = (page - 1) * limit

  const applications = await CreditApplicationModel.findAll({
    status: status as any,
    search,
    limit,
    skip
  })

  const stats = await CreditApplicationModel.getStats()

  return json({ applications, stats, filters: { status, search, page } })
}

export async function action(args: ActionFunctionArgs) {
  const user = await requireClerkAdmin(args)

  const formData = await args.request.formData()
  const action = formData.get("action") as string
  const applicationId = formData.get("applicationId") as string

  try {
    switch (action) {
      case "approve": {
        const approvedAmount = parseFloat(formData.get("approvedAmount") as string)
        const approvedTerm = parseInt(formData.get("approvedTerm") as string)
        const interestRate = parseFloat(formData.get("interestRate") as string)
        const comments = formData.get("comments") as string

        // Calcular pago mensual
        const monthlyRate = interestRate / 100 / 12
        const numPayments = approvedTerm
        const monthlyPayment = (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                              (Math.pow(1 + monthlyRate, numPayments) - 1)

        await CreditApplicationModel.updateStatus(applicationId, "approved", {
          reviewedBy: user._id!,
          reviewedAt: new Date(),
          approvedAmount,
          approvedTerm,
          interestRate,
          monthlyPayment: Math.round(monthlyPayment),
          comments
        })

        return json({ success: true, message: "Solicitud aprobada exitosamente" })
      }

      case "reject": {
        const rejectionReason = formData.get("rejectionReason") as string
        const comments = formData.get("comments") as string

        await CreditApplicationModel.updateStatus(applicationId, "rejected", {
          reviewedBy: user._id!,
          reviewedAt: new Date(),
          rejectionReason,
          comments
        })

        return json({ success: true, message: "Solicitud rechazada" })
      }

      case "review": {
        await CreditApplicationModel.updateStatus(applicationId, "under_review")
        return json({ success: true, message: "Solicitud marcada como en revisión" })
      }

      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing application:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
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

type ViewType = 'list' | 'grid'

export default function AdminCreditApplications() {
  const { applications, stats, filters } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')
  const {isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onOpenChange: onDetailModalOpenChange} = useDisclosure()

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStatusChange = (applicationId: string, action: string) => {
    const application = applications.find(app => app._id?.toString() === applicationId)
    setSelectedApplication(application)
    
    if (action === "approve") {
      setShowApprovalModal(true)
    } else if (action === "reject") {
      setShowRejectionModal(true)
    } else {
      submit({ action, applicationId }, { method: "post" })
    }
  }

  const handleApproval = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.append("action", "approve")
    formData.append("applicationId", selectedApplication._id.toString())
    
    submit(formData, { method: "post" })
    setShowApprovalModal(false)
    setSelectedApplication(null)
  }

  const handleRejection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.append("action", "reject")
    formData.append("applicationId", selectedApplication._id.toString())
    
    submit(formData, { method: "post" })
    setShowRejectionModal(false)
    setSelectedApplication(null)
  }

  const handleViewDetails = (application: any) => {
    setSelectedApplication(application)
    onDetailModalOpen()
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      identification: 'Identificación',
      income_proof: 'Comprobante de Ingresos',
      address_proof: 'Comprobante de Domicilio',
      bank_statement: 'Estado de Cuenta',
      other: 'Otro'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitudes de Crédito
          </h1>
          <p className="text-gray-600">
            Gestiona y revisa las solicitudes de financiamiento de los usuarios
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.byStatus.pending?.count || 0}
                </p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Requieren atención
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Revisión</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.byStatus.under_review?.count || 0}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Eye className="w-4 h-4 mr-1" />
                  En proceso
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.byStatus.approved?.count || 0}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Exitosas
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Todas las solicitudes
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <Form method="get" className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Nombre, email, CURP..."
                  defaultValue={filters.search || ""}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Estado</Label>
              <select
                name="status"
                defaultValue={filters.status || ""}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="under_review">En Revisión</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
            
            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </Form>
        </Card>

        {/* View Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Vista:</span>
            <ButtonGroup size="sm" variant="bordered">
              <HeroButton
                isIconOnly
                variant={viewType === 'list' ? 'solid' : 'bordered'}
                color={viewType === 'list' ? 'primary' : 'default'}
                onClick={() => setViewType('list')}
              >
                <List className="w-4 h-4" />
              </HeroButton>
              <HeroButton
                isIconOnly
                variant={viewType === 'grid' ? 'solid' : 'bordered'}
                color={viewType === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewType('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </HeroButton>
            </ButtonGroup>
          </div>
          <div className="text-sm text-gray-500">
            {applications.length} solicitud{applications.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* Applications List */}
        <motion.div 
          layout
          className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-6'}
        >
          <AnimatePresence mode="popLayout">
            {applications.map((application) => {
              const status = statusConfig[application.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              
              return (
                <motion.div
                  key={application._id?.toString()}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={viewType === 'grid' ? 'h-fit' : ''}
                >
                  <HeroCard className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    {/* Header Section */}
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.personalInfo.fullName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Solicitud #{application._id?.toString().slice(-6).toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(application.createdAt.toString())}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Chip
                            color={
                              application.status === 'approved' ? 'success' :
                              application.status === 'rejected' ? 'danger' :
                              application.status === 'under_review' ? 'primary' :
                              'warning'
                            }
                            variant="flat"
                            startContent={<StatusIcon className="w-3 h-3" />}
                          >
                            {status.label}
                          </Chip>
                        </div>
                      </div>
                    </CardHeader>

                    <CardBody className="pt-0">
                      {/* Vista compacta - Solo información básica */}
                      <div className="space-y-4">
                        {/* Información básica */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(application.financialInfo.requestedAmount)}
                            </p>
                            <p className="text-xs text-gray-500">Monto Solicitado</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(application.employmentInfo.monthlyIncome)}
                            </p>
                            <p className="text-xs text-gray-500">Ingresos Mensuales</p>
                          </div>
                        </div>
                        
                        {/* Estado de la solicitud */}
                        {application.reviewInfo && (
                          <div className={`p-3 rounded-lg text-center ${
                            application.status === 'approved' ? 'bg-green-50 border border-green-200' :
                            application.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                            'bg-blue-50 border border-blue-200'
                          }`}>
                            {application.status === 'approved' && (
                              <div>
                                <p className="text-sm font-semibold text-green-700">
                                  Aprobado: {formatCurrency(application.reviewInfo.approvedAmount || 0)}
                                </p>
                                <p className="text-xs text-green-600">
                                  Pago mensual: {formatCurrency(application.reviewInfo.monthlyPayment || 0)}
                                </p>
                              </div>
                            )}
                            {application.status === 'rejected' && (
                              <p className="text-sm font-semibold text-red-700">
{application.reviewInfo.rejectionReason ? getRejectionReasonLabel(application.reviewInfo.rejectionReason) : 'Solicitud Rechazada'}                              </p>
                            )}
                          </div>
                        )}

                        {/* Información del vehículo */}
                        {application.listing && application.listing.length > 0 && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <Building className="w-4 h-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-900">Vehículo de Interés</p>
                            </div>
                            <p className="text-sm text-blue-800">
                              {application.listing[0].brand} {application.listing[0].model} {application.listing[0].year}
                            </p>
                            <p className="text-sm font-semibold text-blue-900">
                              {formatCurrency(application.listing[0].price)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                        <div className="text-sm text-gray-500">
                          {application.documents.length} documento(s)
                        </div>
                        
                        <div className="flex space-x-2">
                          <HeroButton
                            size="sm"
                            variant="bordered"
                            color="primary"
                            startContent={<Eye className="w-4 h-4" />}
                            onClick={() => handleViewDetails(application)}
                          >
                            Ver Detalles
                          </HeroButton>
                          
                          {application.status === 'pending' && (
                            <>
                              <HeroButton
                                size="sm"
                                variant="bordered"
                                color="warning"
                                onClick={() => handleStatusChange(application._id!.toString(), "review")}
                              >
                                En Revisión
                              </HeroButton>
                              <HeroButton
                                size="sm"
                                variant="bordered"
                                color="danger"
                                onClick={() => handleStatusChange(application._id!.toString(), "reject")}
                              >
                                Rechazar
                              </HeroButton>
                              <HeroButton
                                size="sm"
                                color="success"
                                onClick={() => handleStatusChange(application._id!.toString(), "approve")}
                              >
                                Aprobar
                              </HeroButton>
                            </>
                          )}
                          
                          {application.status === 'under_review' && (
                            <>
                              <HeroButton
                                size="sm"
                                variant="bordered"
                                color="danger"
                                onClick={() => handleStatusChange(application._id!.toString(), "reject")}
                              >
                                Rechazar
                              </HeroButton>
                              <HeroButton
                                size="sm"
                                color="success"
                                onClick={() => handleStatusChange(application._id!.toString(), "approve")}
                              >
                                Aprobar
                              </HeroButton>
                            </>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </HeroCard>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {applications.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron solicitudes
            </h3>
            <p className="text-gray-600">
              No hay solicitudes que coincidan con los filtros seleccionados
            </p>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onOpenChange={onDetailModalOpenChange}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0",
          header: "border-b border-gray-200"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                {selectedApplication && (
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedApplication.personalInfo.fullName}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        Solicitud #{selectedApplication._id?.toString().slice(-6).toUpperCase()} •
                        {formatDate(selectedApplication.createdAt.toString())}
                      </p>
                    </div>
                  </div>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedApplication && (
                  <Tabs
                    aria-label="Información de la solicitud"
                    color="primary"
                    variant="underlined"
                    classNames={{
                      tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                      cursor: "w-full bg-primary",
                      tab: "max-w-fit px-4 h-12",
                      tabContent: "group-data-[selected=true]:text-primary"
                    }}
                  >
                    {/* Resumen Tab */}
                    <Tab
                      key="resumen"
                      title={
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Resumen</span>
                        </div>
                      }
                    >
                      <div className="p-6 space-y-6">
                        {/* Status y Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className={`p-4 rounded-lg border ${
                              selectedApplication.status === 'approved' ? 'bg-green-50 border-green-200' :
                              selectedApplication.status === 'rejected' ? 'bg-red-50 border-red-200' :
                              selectedApplication.status === 'under_review' ? 'bg-blue-50 border-blue-200' :
                              'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  selectedApplication.status === 'approved' ? 'bg-green-100' :
                                  selectedApplication.status === 'rejected' ? 'bg-red-100' :
                                  selectedApplication.status === 'under_review' ? 'bg-blue-100' :
                                  'bg-yellow-100'
                                }`}>
                                  {selectedApplication.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {selectedApplication.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                                  {selectedApplication.status === 'under_review' && <Eye className="w-4 h-4 text-blue-600" />}
                                  {selectedApplication.status === 'pending' && <Clock className="w-4 h-4 text-yellow-600" />}
                                </div>
                                <div>
                                  <h3 className="font-semibold">Estado de la Solicitud</h3>
                                  <p className="text-sm text-gray-600">
                                    {statusConfig[selectedApplication.status as keyof typeof statusConfig]?.label}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedApplication.reviewInfo && (
                                <div className="mt-4 space-y-2">
                                  {selectedApplication.status === 'approved' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Monto Aprobado:</span>
                                        <span className="font-semibold text-green-600">
                                          {formatCurrency(selectedApplication.reviewInfo.approvedAmount || 0)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Pago Mensual:</span>
                                        <span className="font-semibold">
                                          {formatCurrency(selectedApplication.reviewInfo.monthlyPayment || 0)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  {selectedApplication.reviewInfo.comments && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded">
                                      <p className="text-sm"><strong>Comentarios:</strong> {selectedApplication.reviewInfo.comments}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <DollarSign className="w-5 h-5 text-green-600" />
                                  <span className="text-sm font-medium text-green-800">Monto Solicitado</span>
                                </div>
                                <p className="text-xl font-bold text-green-700">
                                  {formatCurrency(selectedApplication.financialInfo.requestedAmount)}
                                </p>
                              </div>
                              
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <TrendingUp className="w-5 h-5 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Ingresos Mensuales</span>
                                </div>
                                <p className="text-xl font-bold text-blue-700">
                                  {formatCurrency(selectedApplication.employmentInfo.monthlyIncome)}
                                </p>
                              </div>
                              
                              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <CreditCard className="w-5 h-5 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-800">Enganche</span>
                                </div>
                                <p className="text-xl font-bold text-purple-700">
                                  {formatCurrency(selectedApplication.financialInfo.downPayment)}
                                </p>
                              </div>
                              
                              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Calendar className="w-5 h-5 text-orange-600" />
                                  <span className="text-sm font-medium text-orange-800">Plazo</span>
                                </div>
                                <p className="text-xl font-bold text-orange-700">
                                  {selectedApplication.financialInfo.preferredTerm} meses
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vehicle Info */}
                        {selectedApplication.listing && selectedApplication.listing.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <Building className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-blue-900">Vehículo de Interés</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-lg font-bold text-blue-800">
                                  {selectedApplication.listing[0].brand} {selectedApplication.listing[0].model} {selectedApplication.listing[0].year}
                                </p>
                                <p className="text-sm text-blue-600">Modelo y Año</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(selectedApplication.listing[0].price)}
                                </p>
                                <p className="text-sm text-blue-600">Precio del Vehículo</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Tab>

                    {/* Personal Info Tab */}
                    <Tab
                      key="personal"
                      title={
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Personal</span>
                        </div>
                      }
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold">{selectedApplication.personalInfo.fullName}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">Email</label>
                            </div>
                            <p className="text-sm text-gray-900">{selectedApplication.personalInfo.email}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">Teléfono</label>
                            </div>
                            <p className="text-sm text-gray-900">{selectedApplication.personalInfo.phone}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                            </div>
                            <p className="text-sm text-gray-900">
                              {new Date(selectedApplication.personalInfo.dateOfBirth).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">CURP</label>
                            </div>
                            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">{selectedApplication.personalInfo.curp}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">RFC</label>
                            </div>
                            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                              {selectedApplication.personalInfo.rfc || 'No proporcionado'}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Heart className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">Estado Civil</label>
                            </div>
                            <p className="text-sm text-gray-900">{getMaritalStatusLabel(selectedApplication.personalInfo.maritalStatus)}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <label className="text-sm font-medium text-gray-500">Dependientes</label>
                            </div>
                            <p className="text-sm text-gray-900">{selectedApplication.personalInfo.dependents}</p>
                          </div>
                        </div>
                      </div>
                    </Tab>

                    {/* Documents Tab */}
                    <Tab
                      key="documents"
                      title={
                        <div className="flex items-center space-x-2">
                          <FileImage className="w-4 h-4" />
                          <span>Documentos ({selectedApplication.documents.length})</span>
                        </div>
                      }
                    >
                      <div className="p-6">
                        {selectedApplication.documents.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedApplication.documents.map((doc: any, index: number) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-900 block">{getDocumentTypeLabel(doc.type)}</span>
                                      <span className="text-xs text-gray-500">{doc.name}</span>
                                    </div>
                                  </div>
                                  <HeroButton
                                    size="sm"
                                    variant="bordered"
                                    isIconOnly
                                    onClick={() => window.open(doc.url, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </HeroButton>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <p>Tamaño: {(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                                  <p>Subido: {new Date(doc.uploadedAt).toLocaleDateString('es-MX')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos adjuntos</h3>
                            <p>Esta solicitud no tiene documentos cargados.</p>
                          </div>
                        )}
                      </div>
                    </Tab>
                  </Tabs>
                )}
              </ModalBody>
              <ModalFooter className="border-t border-gray-200">
                <HeroButton color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </HeroButton>
                {selectedApplication && (
                  <div className="flex space-x-2">
                    {selectedApplication.status === 'pending' && (
                      <>
                        <HeroButton
                          color="warning"
                          variant="bordered"
                          onClick={() => {
                            handleStatusChange(selectedApplication._id!.toString(), "review")
                            onClose()
                          }}
                        >
                          Marcar en Revisión
                        </HeroButton>
                        <HeroButton
                          color="danger"
                          variant="bordered"
                          onClick={() => {
                            handleStatusChange(selectedApplication._id!.toString(), "reject")
                            onClose()
                          }}
                        >
                          Rechazar
                        </HeroButton>
                        <HeroButton
                          color="success"
                          onClick={() => {
                            handleStatusChange(selectedApplication._id!.toString(), "approve")
                            onClose()
                          }}
                        >
                          Aprobar
                        </HeroButton>
                      </>
                    )}
                    
                    {selectedApplication.status === 'under_review' && (
                      <>
                        <HeroButton
                          color="danger"
                          variant="bordered"
                          onClick={() => {
                            handleStatusChange(selectedApplication._id!.toString(), "reject")
                            onClose()
                          }}
                        >
                          Rechazar
                        </HeroButton>
                        <HeroButton
                          color="success"
                          onClick={() => {
                            handleStatusChange(selectedApplication._id!.toString(), "approve")
                            onClose()
                          }}
                        >
                          Aprobar
                        </HeroButton>
                      </>
                    )}
                  </div>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Approval Modal */}
      {showApprovalModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Aprobar Solicitud</h3>
            <Form onSubmit={handleApproval} className="space-y-4">
              <div>
                <Label htmlFor="approvedAmount">Monto Aprobado</Label>
                <Input
                  id="approvedAmount"
                  name="approvedAmount"
                  type="number"
                  defaultValue={selectedApplication.financialInfo.requestedAmount}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="approvedTerm">Plazo Aprobado (meses)</Label>
                <select
                  name="approvedTerm"
                  defaultValue={selectedApplication.financialInfo.preferredTerm.toString()}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="12">12 meses</option>
                  <option value="24">24 meses</option>
                  <option value="36">36 meses</option>
                  <option value="48">48 meses</option>
                  <option value="60">60 meses</option>
                  <option value="72">72 meses</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="interestRate">Tasa de Interés Anual (%)</Label>
                <Input
                  id="interestRate"
                  name="interestRate"
                  type="number"
                  step="0.1"
                  defaultValue="12.5"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="comments">Comentarios</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Comentarios adicionales..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  Aprobar
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rechazar Solicitud</h3>
            <Form onSubmit={handleRejection} className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Motivo del Rechazo</Label>
                <select
                  name="rejectionReason"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                <option value="insufficient_income">{getRejectionReasonLabel('insufficient_income')}</option>
                <option value="poor_credit_history">{getRejectionReasonLabel('poor_credit_history')}</option>
                <option value="incomplete_documentation">{getRejectionReasonLabel('incomplete_documentation')}</option>
                <option value="high_debt_ratio">{getRejectionReasonLabel('high_debt_ratio')}</option>
                <option value="employment_instability">{getRejectionReasonLabel('employment_instability')}</option>
                <option value="other">{getRejectionReasonLabel('other')}</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="comments">Comentarios Adicionales</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Explicación detallada del rechazo..."
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                  Rechazar
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}