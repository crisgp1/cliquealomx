import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData, Link } from "@remix-run/react"
import { requireClerkUser } from "~/lib/auth-clerk.server"
import { CreditApplicationModel } from "~/models/CreditApplication.server"
import { 
  ArrowLeft,
  FileText,
  User,
  Briefcase,
  DollarSign,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react'
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Divider,
  Progress
} from "@heroui/react"

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data || !data.application) {
    return [
      { title: "Aplicación no encontrada | Cliquéalo.mx" },
      { name: "description", content: "La aplicación de crédito que buscas no se encuentra disponible." }
    ];
  }

  const application = data.application;
  return [
    { title: `Aplicación de Crédito - ${application.personalInfo.fullName} | Cliquéalo.mx` },
    { name: "description", content: `Detalles de la aplicación de crédito de ${application.personalInfo.fullName} por $${application.financialInfo.requestedAmount.toLocaleString()} MXN.` }
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkUser(args)
  const applicationId = args.params.id
  
  if (!applicationId) {
    throw new Response("ID de aplicación requerido", { status: 400 })
  }

  // Obtener la aplicación con detalles completos
  const application = await CreditApplicationModel.findByIdWithDetails(applicationId)
  
  if (!application) {
    throw new Response("Aplicación de crédito no encontrada", { status: 404 })
  }

  // Verificar permisos: solo el dueño de la aplicación o un admin pueden verla
  const isOwner = application.user.clerkId === user.clerkId
  const isAdmin = user.role === 'admin' || user.role === 'superadmin'
  
  if (!isOwner && !isAdmin) {
    throw new Response("No tienes permisos para ver esta aplicación", { status: 403 })
  }

  return json({
    application,
    user,
    isOwner,
    isAdmin
  })
}

type LoaderData = {
  application: any
  user: any
  isOwner: boolean
  isAdmin: boolean
}

export default function CreditApplicationDetail() {
  const { application, user, isOwner, isAdmin } = useLoaderData<LoaderData>()

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
          <Chip
            startContent={<AlertCircle className="w-4 h-4" />}
            variant="flat"
            color="default"
          >
            Desconocido
          </Chip>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      {/* Header */}
      <header className="border-b border-red-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              as={Link}
              to="/credit/my-applications"
              variant="light"
              startContent={<ArrowLeft className="w-4 h-4" />}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              <span className="hidden sm:inline">Volver a Mis Aplicaciones</span>
              <span className="sm:hidden">Volver</span>
            </Button>

            <div className="flex items-center gap-4">
              {getStatusBadge(application.status)}
              <Chip
                variant="bordered"
                color="default"
                size="sm"
                className="font-mono"
              >
                ID: {application._id.slice(-8).toUpperCase()}
              </Chip>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Información Personal
                </h2>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                    <p className="text-gray-900 font-medium">{application.personalInfo.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{application.personalInfo.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-gray-900">{application.personalInfo.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                    <p className="text-gray-900">{formatDate(application.personalInfo.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CURP</label>
                    <p className="text-gray-900 font-mono">{application.personalInfo.curp}</p>
                  </div>
                  {application.personalInfo.rfc && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">RFC</label>
                      <p className="text-gray-900 font-mono">{application.personalInfo.rfc}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado Civil</label>
                    <p className="text-gray-900 capitalize">{application.personalInfo.maritalStatus}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dependientes</label>
                    <p className="text-gray-900">{application.personalInfo.dependents}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Información Laboral */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-600" />
                  Información Laboral
                </h2>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Empleo</label>
                    <p className="text-gray-900 capitalize">{application.employmentInfo.employmentType}</p>
                  </div>
                  {application.employmentInfo.companyName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Empresa</label>
                      <p className="text-gray-900">{application.employmentInfo.companyName}</p>
                    </div>
                  )}
                  {application.employmentInfo.position && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Puesto</label>
                      <p className="text-gray-900">{application.employmentInfo.position}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ingresos Mensuales</label>
                    <p className="text-gray-900 font-semibold">{formatCurrency(application.employmentInfo.monthlyIncome)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Experiencia Laboral</label>
                    <p className="text-gray-900">{application.employmentInfo.workExperience} años</p>
                  </div>
                  {application.employmentInfo.workAddress && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Dirección de Trabajo</label>
                      <p className="text-gray-900">{application.employmentInfo.workAddress}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Información Financiera */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  Información Financiera
                </h2>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Monto Solicitado</label>
                    <p className="text-gray-900 font-bold text-lg">{formatCurrency(application.financialInfo.requestedAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Enganche</label>
                    <p className="text-gray-900 font-semibold">{formatCurrency(application.financialInfo.downPayment)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plazo Preferido</label>
                    <p className="text-gray-900">{application.financialInfo.preferredTerm} meses</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gastos Mensuales</label>
                    <p className="text-gray-900">{formatCurrency(application.financialInfo.monthlyExpenses)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Otras Deudas</label>
                    <p className="text-gray-900">{formatCurrency(application.financialInfo.otherDebts)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Banco</label>
                    <p className="text-gray-900">{application.financialInfo.bankName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Cuenta</label>
                    <p className="text-gray-900 capitalize">{application.financialInfo.accountType}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Contacto de Emergencia */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-600" />
                  Contacto de Emergencia
                </h2>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre</label>
                    <p className="text-gray-900">{application.emergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Relación</label>
                    <p className="text-gray-900">{application.emergencyContact.relationship}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p className="text-gray-900">{application.emergencyContact.phone}</p>
                  </div>
                  {application.emergencyContact.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dirección</label>
                      <p className="text-gray-900">{application.emergencyContact.address}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Documentos */}
            {application.documents && application.documents.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Documentos Adjuntos ({application.documents.length})
                  </h2>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="space-y-3">
                    {application.documents.map((doc: any, index: number) => (
                      <div key={doc.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-sm text-gray-500">
                              {doc.type} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          as="a"
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="light"
                          size="sm"
                          startContent={<Download className="w-4 h-4" />}
                        >
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen de la Aplicación */}
            <Card className="shadow-lg border-l-4 border-red-500">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Resumen de la Aplicación</h3>
              </CardHeader>
              <CardBody className="pt-0 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(application.status)}
                  </div>
                </div>

                <Divider />

                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Solicitud</label>
                  <p className="text-gray-900 flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(application.createdAt)}
                  </p>
                </div>

                {application.submittedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Envío</label>
                    <p className="text-gray-900 flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(application.submittedAt)}
                    </p>
                  </div>
                )}

                <Divider />

                <div>
                  <label className="text-sm font-medium text-gray-500">Monto Solicitado</label>
                  <p className="text-gray-900 font-bold text-lg">{formatCurrency(application.financialInfo.requestedAmount)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Enganche</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(application.financialInfo.downPayment)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Plazo</label>
                  <p className="text-gray-900">{application.financialInfo.preferredTerm} meses</p>
                </div>

                {/* Vehículo asociado */}
                {application.listing && application.listing.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vehículo de Interés</label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{application.listing[0].title}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(application.listing[0].price)}
                        </p>
                        <Button
                          as={Link}
                          to={`/listings/${application.listing[0]._id}`}
                          variant="light"
                          size="sm"
                          className="mt-2"
                          startContent={<Eye className="w-4 h-4" />}
                        >
                          Ver Vehículo
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Información de Revisión (solo si existe) */}
            {application.reviewInfo && (
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Información de Revisión</h3>
                </CardHeader>
                <CardBody className="pt-0 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Revisado por</label>
                    <p className="text-gray-900">
                      {application.reviewer && application.reviewer.length > 0 
                        ? application.reviewer[0].name 
                        : 'Administrador'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Revisión</label>
                    <p className="text-gray-900">{formatDate(application.reviewInfo.reviewedAt)}</p>
                  </div>

                  {application.reviewInfo.approvedAmount && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Monto Aprobado</label>
                      <p className="text-gray-900 font-semibold text-green-600">
                        {formatCurrency(application.reviewInfo.approvedAmount)}
                      </p>
                    </div>
                  )}

                  {application.reviewInfo.approvedTerm && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Plazo Aprobado</label>
                      <p className="text-gray-900">{application.reviewInfo.approvedTerm} meses</p>
                    </div>
                  )}

                  {application.reviewInfo.interestRate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tasa de Interés</label>
                      <p className="text-gray-900">{application.reviewInfo.interestRate}% anual</p>
                    </div>
                  )}

                  {application.reviewInfo.monthlyPayment && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Pago Mensual</label>
                      <p className="text-gray-900 font-semibold">
                        {formatCurrency(application.reviewInfo.monthlyPayment)}
                      </p>
                    </div>
                  )}

                  {application.reviewInfo.comments && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Comentarios</label>
                      <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-lg mt-1">
                        {application.reviewInfo.comments}
                      </p>
                    </div>
                  )}

                  {application.reviewInfo.rejectionReason && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Motivo de Rechazo</label>
                      <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-1">
                        {application.reviewInfo.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Acciones */}
            <Card className="shadow-lg">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Acciones</h3>
              </CardHeader>
              <CardBody className="pt-0 space-y-3">
                <Button
                  as={Link}
                  to="/credit/my-applications"
                  variant="flat"
                  color="primary"
                  className="w-full"
                  startContent={<ArrowLeft className="w-4 h-4" />}
                >
                  Ver Todas mis Aplicaciones
                </Button>

                {application.status === 'pending' && isOwner && (
                  <Button
                    as={Link}
                    to={`/credit/apply?edit=${application._id}`}
                    variant="bordered"
                    color="default"
                    className="w-full"
                    startContent={<FileText className="w-4 h-4" />}
                  >
                    Editar Aplicación
                  </Button>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}