import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { requireClerkAdmin } from "~/lib/auth-clerk.server"
import { AdminLayout } from "~/components/admin/AdminLayout"
import { HelpCircle, ChevronRight, Search, BookOpen, Zap, Shield, Users, Car, CreditCard, Building2, Calendar, Calculator, FileText, Settings, X, AlertTriangle, CheckCircle, Clock, List, Grid, Eye, AlertCircle, Scale, DollarSign, UserCheck, Briefcase } from 'lucide-react'
import React, { useState } from 'react'

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkAdmin(args)
  
  return json({ currentUser: user })
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  icon: any
  adminOnly?: boolean
  superAdminOnly?: boolean
  detailedContent?: {
    overview: string
    requirements?: string[]
    legalObligations?: string[]
    risks?: string[]
    bestPractices?: string[]
    steps?: Array<{
      title: string
      description: string
      icon: any
    }>
    warnings?: string[]
    documentation?: string[]
  }
}

const faqData: FAQItem[] = [
  // Dashboard
  {
    id: "dashboard-overview",
    question: "¿Cómo interpretar las métricas del dashboard?",
    answer: "El dashboard muestra estadísticas en tiempo real de la plataforma. Las tarjetas principales incluyen total de usuarios, listings activos, solicitudes de crédito y citas agendadas. Las gráficas te permiten visualizar tendencias mensuales.",
    category: "Dashboard",
    icon: BookOpen
  },
  
  // Usuarios - Solo SuperAdmin
  {
    id: "users-management",
    question: "¿Cómo gestionar usuarios y roles?",
    answer: "En la sección de Usuarios puedes ver todos los usuarios registrados, cambiar roles (usuario, admin, superadmin), y monitorear la actividad. Solo los super administradores pueden acceder a esta funcionalidad.",
    category: "Gestión de Usuarios",
    icon: Users,
    superAdminOnly: true
  },
  {
    id: "users-roles",
    question: "¿Cuáles son los diferentes roles disponibles?",
    answer: "Los roles disponibles son: Usuario (acceso básico), Admin (puede gestionar listings, créditos, prospectos), y Super Admin (acceso completo incluyendo gestión de usuarios y configuraciones avanzadas).",
    category: "Gestión de Usuarios",
    icon: Shield,
    superAdminOnly: true
  },
  
  // Listings
  {
    id: "listings-create",
    question: "¿Cómo crear un nuevo listing de vehículo?",
    answer: "Ve a la sección Listings y haz clic en 'Crear'. Completa todos los campos requeridos: información del vehículo, precio, descripción, ubicación y sube al menos 5 fotos de alta calidad. El sistema optimizará automáticamente las imágenes.",
    category: "Gestión de Listings",
    icon: Car
  },
  {
    id: "listings-edit",
    question: "¿Cómo editar o eliminar un listing existente?",
    answer: "En la sección Listings, encuentra el vehículo que deseas modificar. Puedes editar información, cambiar el estado (activo, vendido, pausado), actualizar precios o eliminar el listing completamente.",
    category: "Gestión de Listings",
    icon: Car
  },
  {
    id: "listings-photos",
    question: "¿Qué requisitos tienen las fotos de los listings?",
    answer: "Las fotos deben ser de alta resolución (mínimo 1080x720px), mostrar diferentes ángulos del vehículo (exterior, interior, motor, documentos). Se recomienda subir entre 8-15 fotos para mejor presentación.",
    category: "Gestión de Listings",
    icon: Car
  },
  
  // Créditos
  {
    id: "credit-review",
    question: "¿Cómo revisar y aprobar solicitudes de crédito?",
    answer: "En la sección Créditos verás todas las solicitudes pendientes. Revisa la información financiera, documentos adjuntos y calificación crediticia. Puedes aprobar, rechazar o solicitar información adicional.",
    category: "Solicitudes de Crédito",
    icon: CreditCard
  },
  {
    id: "credit-documents",
    question: "¿Qué documentos se requieren para aprobar un crédito?",
    answer: "Los documentos requeridos incluyen: identificación oficial, comprobante de ingresos (3 meses), comprobante de domicilio, referencias personales y laborales. Todos los documentos se almacenan de forma segura.",
    category: "Solicitudes de Crédito",
    icon: CreditCard
  },
  
  // Prospectos
  {
    id: "prospects-manage",
    question: "¿Cómo gestionar prospectos de clientes?",
    answer: "Los prospectos se generan automáticamente cuando un usuario muestra interés en un vehículo. Puedes asignar prospectos, agendar citas, hacer seguimiento y actualizar el status del prospecto a lo largo del proceso de venta.",
    category: "Gestión de Prospectos",
    icon: Users
  },
  {
    id: "prospects-followup",
    question: "¿Cómo hacer seguimiento efectivo a los prospectos?",
    answer: "Utiliza las notas internas para registrar cada interacción, programa recordatorios, asigna citas de seguimiento y mantén actualizado el estado del prospecto. El sistema te alertará sobre prospectos que requieren atención.",
    category: "Gestión de Prospectos",
    icon: Users
  },
  
  // Panel Super Admin
  {
    id: "super-admin-board",
    question: "¿Qué funciones adicionales tiene el Panel Super Admin?",
    answer: "El Panel Super Admin ofrece vista completa de todos los prospectos de todos los administradores, métricas avanzadas, gestión de rendimiento por vendedor, y herramientas de análisis profundo para optimización de ventas.",
    category: "Panel Super Admin",
    icon: Shield,
    superAdminOnly: true
  },
  
  // Citas
  {
    id: "appointments-schedule",
    question: "¿Cómo agendar y gestionar citas con clientes?",
    answer: "En la sección Citas puedes ver el calendario completo, agendar nuevas citas, confirmar/cancelar citas existentes, y recibir notificaciones automáticas. Las citas se sincronizan con Google Calendar si está configurado.",
    category: "Gestión de Citas",
    icon: Calendar
  },
  {
    id: "appointments-reminders",
    question: "¿Cómo funcionan los recordatorios de citas?",
    answer: "El sistema envía recordatorios automáticos por email y SMS 24 horas y 1 hora antes de la cita. También puedes enviar recordatorios manuales o reprogramar citas directamente desde el panel.",
    category: "Gestión de Citas",
    icon: Calendar
  },
  
  // Simulador de Crédito
  {
    id: "credit-simulator",
    question: "¿Cómo usar el simulador de crédito?",
    answer: "El simulador permite calcular pagos mensuales, tasas de interés y términos de financiamiento. Ingresa el precio del vehículo, enganche, plazo deseado y el sistema calculará automáticamente las opciones disponibles con diferentes instituciones financieras.",
    category: "Simulador de Crédito",
    icon: Calculator
  },
  
  // Contratos - Compraventa
  {
    id: "contracts-compraventa",
    question: "Contrato de Compraventa - Proceso Completo",
    answer: "Guía completa para gestionar contratos de compraventa de vehículos, incluyendo obligaciones legales, documentación requerida y riesgos a evitar.",
    category: "Contratos - Compraventa",
    icon: FileText,
    detailedContent: {
      overview: "El contrato de compraventa es el documento legal que formaliza la transferencia de propiedad de un vehículo. Este proceso involucra múltiples obligaciones legales y fiscales que deben cumplirse estrictamente para evitar problemas futuros.",
      requirements: [
        "Identificación oficial vigente del comprador y vendedor",
        "RFC vigente de ambas partes",
        "Comprobante de domicilio no mayor a 3 meses",
        "Tarjeta de circulación original",
        "Factura original o carta factura",
        "Verificación vehicular vigente",
        "Seguro de auto vigente",
        "Tenencia vehicular al corriente",
        "No adeudos de multas e infracciones"
      ],
      legalObligations: [
        "Registro ante el Registro Público Vehicular (REPUVE)",
        "Pago del Impuesto Sobre Adquisición de Automóviles Nuevos (ISAN) si aplica",
        "Declaración del ISR por enajenación de bienes (si el vendedor es persona física)",
        "Actualización de la tarjeta de circulación a nombre del nuevo propietario",
        "Notificación del cambio de propietario ante la aseguradora",
        "Cumplimiento con las disposiciones fiscales locales y federales",
        "Verificación de que el vehículo no reporte robo"
      ],
      risks: [
        "Vehículo con adeudos fiscales ocultos",
        "Documentación apócrifa o alterada",
        "Vehículo reportado como robado",
        "Gravámenes no declarados (créditos vigentes)",
        "Problemas mecánicos ocultos no declarados",
        "Responsabilidad civil por accidentes previos",
        "Multas e infracciones pendientes de pago"
      ],
      steps: [
        {
          title: "Verificación Previa",
          description: "Validar documentos, historial vehicular y situación legal",
          icon: CheckCircle
        },
        {
          title: "Elaboración del Contrato",
          description: "Redactar contrato con todas las cláusulas legales necesarias",
          icon: FileText
        },
        {
          title: "Firma y Formalización",
          description: "Firma ante testigos y/o notario según el valor del vehículo",
          icon: UserCheck
        },
        {
          title: "Trámites Fiscales",
          description: "Realizar pagos de impuestos y actualizaciones registrales",
          icon: DollarSign
        },
        {
          title: "Entrega y Registro",
          description: "Entrega física del vehículo y registro final ante autoridades",
          icon: Car
        }
      ],
      warnings: [
        "Nunca aceptar pagos en efectivo superiores a $100,000 MXN",
        "Verificar que el vendedor sea el propietario legítimo",
        "No omitir la verificación en bases de datos de vehículos robados",
        "Exigir el saldo de adeudos antes de la firma"
      ],
      documentation: [
        "Contrato de compraventa (3 ejemplares)",
        "Recibo de pago por concepto de compraventa",
        "Acta de entrega-recepción del vehículo",
        "Comprobante de pago de impuestos",
        "Copia de identificaciones y comprobantes"
      ]
    }
  },
  
  // Contratos - Apartado
  {
    id: "contracts-apartado",
    question: "Contrato de Apartado - Proceso y Obligaciones",
    answer: "Procedimiento para formalizar apartados de vehículos, garantizando los derechos tanto del cliente como del concesionario.",
    category: "Contratos - Apartado",
    icon: Clock,
    detailedContent: {
      overview: "El contrato de apartado es un acuerdo preliminar que reserva un vehículo específico por un período determinado, mediante el pago de una cantidad como seña. Este documento protege los intereses de ambas partes mientras se completa el proceso de compra.",
      requirements: [
        "Identificación oficial del interesado",
        "Comprobante de ingresos o capacidad de pago",
        "Enganche mínimo del 10% del valor del vehículo",
        "Definición clara del plazo de apartado (máximo 30 días)",
        "Especificaciones exactas del vehículo",
        "Condiciones de financiamiento si aplica"
      ],
      legalObligations: [
        "Especificar claramente las condiciones de cancelación",
        "Definir el destino del enganche en caso de incumplimiento",
        "Establecer penalizaciones por retraso en pagos",
        "Incluir cláusula de fuerza mayor",
        "Respetar los términos de la Ley Federal de Protección al Consumidor",
        "Mantener el vehículo en las condiciones acordadas"
      ],
      risks: [
        "Pérdida del enganche por incumplimiento del cliente",
        "Variación en el valor del vehículo durante el apartado",
        "Daños al vehículo durante el período de reserva",
        "Cambios en las condiciones crediticias",
        "Cancelación unilateral por parte del vendedor"
      ],
      steps: [
        {
          title: "Evaluación del Cliente",
          description: "Verificar capacidad de pago e historial crediticio",
          icon: UserCheck
        },
        {
          title: "Definición de Términos",
          description: "Establecer precio, plazo y condiciones del apartado",
          icon: FileText
        },
        {
          title: "Pago de Enganche",
          description: "Recibir y documentar el pago inicial",
          icon: DollarSign
        },
        {
          title: "Seguimiento",
          description: "Monitorear cumplimiento de pagos y plazos",
          icon: Clock
        },
        {
          title: "Formalización Final",
          description: "Completar la venta o proceder según lo acordado",
          icon: CheckCircle
        }
      ],
      warnings: [
        "El apartado no constituye venta definitiva",
        "Los plazos deben respetarse estrictamente",
        "Documentar todos los pagos parciales",
        "Mantener comunicación constante con el cliente"
      ]
    }
  },
  
  // Contratos - Consignación
  {
    id: "contracts-consignacion",
    question: "Contrato de Consignación - Marco Legal y Responsabilidades",
    answer: "Proceso completo para gestionar vehículos en consignación, incluyendo responsabilidades, seguros y aspectos fiscales.",
    category: "Contratos - Consignación",
    icon: Briefcase,
    detailedContent: {
      overview: "El contrato de consignación permite que el concesionario ofrezca vehículos de terceros para su venta, manteniendo la propiedad en el consignante hasta la venta final. Este esquema requiere especial atención legal y fiscal.",
      requirements: [
        "Identificación y RFC del consignante",
        "Documentos originales del vehículo",
        "Avalúo comercial actualizado",
        "Seguro de responsabilidad civil",
        "Autorización notarial para venta (recomendado)",
        "Comprobante de que el vehículo está libre de gravamen",
        "Fotografías del estado actual del vehículo"
      ],
      legalObligations: [
        "Mantener registro detallado de vehículos en consignación",
        "Emitir comprobante fiscal por comisión de venta",
        "Responder por daños durante la custodia",
        "Informar mensualmente sobre el estatus de la venta",
        "Transferir el importe de venta según lo pactado",
        "Cumplir con las obligaciones de la Ley General de Títulos y Operaciones de Crédito"
      ],
      risks: [
        "Responsabilidad por daños durante la custodia",
        "Problemas legales si el vehículo tiene gravámenes ocultos",
        "Disputas sobre el precio final de venta",
        "Deterioro del vehículo durante el período de consignación",
        "Reclamaciones de terceros sobre la propiedad",
        "Complicaciones fiscales por la naturaleza del contrato"
      ],
      steps: [
        {
          title: "Evaluación Inicial",
          description: "Inspeccionar vehículo y verificar documentación",
          icon: Eye
        },
        {
          title: "Elaboración del Contrato",
          description: "Definir comisiones, plazos y responsabilidades",
          icon: FileText
        },
        {
          title: "Registro y Custodia",
          description: "Resguardar vehículo y documentos originales",
          icon: Shield
        },
        {
          title: "Comercialización",
          description: "Promocionar y gestionar la venta del vehículo",
          icon: Car
        },
        {
          title: "Liquidación Final",
          description: "Completar venta y entregar importe al consignante",
          icon: DollarSign
        }
      ],
      warnings: [
        "Verificar exhaustivamente la propiedad legítima",
        "Mantener seguros vigentes durante toda la consignación",
        "Documentar cualquier daño preexistente",
        "Establecer límites claros de tiempo para la venta"
      ],
      bestPractices: [
        "Realizar avalúo por perito certificado",
        "Contratar seguro específico para vehículos en consignación",
        "Mantener comunicación regular con el propietario",
        "Documentar fotográficamente el estado del vehículo",
        "Establecer comisiones competitivas pero justas"
      ]
    }
  },
  
  // Ventas
  {
    id: "sales-process",
    question: "¿Cómo completar el proceso de venta?",
    answer: "El proceso incluye: confirmación del prospecto, verificación de documentos, procesamiento de financiamiento (si aplica), generación de contrato, y registro final de la venta. El sistema guía paso a paso todo el proceso.",
    category: "Proceso de Ventas",
    icon: Building2
  },
  
  // Expedientes de Autos - Solo SuperAdmin
  {
    id: "car-records",
    question: "¿Cómo gestionar expedientes de vehículos?",
    answer: "Los expedientes contienen historial completo de cada vehículo: documentación legal, historial de mantenimiento, inspecciones técnicas, y registros de propiedad. Solo super administradores pueden acceder a esta sección por motivos de privacidad.",
    category: "Expedientes de Autos",
    icon: FileText,
    superAdminOnly: true
  },
  
  // Aliados Bancarios
  {
    id: "bank-partners",
    question: "¿Cómo gestionar alianzas con instituciones financieras?",
    answer: "En esta sección puedes administrar las relaciones con bancos y financieras, configurar tasas de interés preferenciales, términos de financiamiento, y monitorear el volumen de créditos procesados con cada institución.",
    category: "Aliados Bancarios",
    icon: Building2
  },
  
  // Configuración
  {
    id: "settings-general",
    question: "¿Cómo configurar las opciones generales del sistema?",
    answer: "En Configuración puedes personalizar opciones del sitio, configurar notificaciones, ajustar parámetros de crédito, gestionar plantillas de email, y configurar integraciones con servicios externos como WhatsApp Business.",
    category: "Configuración",
    icon: Settings
  }
]

export default function ManualUsuario() {
  const { currentUser } = useLoaderData<typeof loader>()
  const isSuperAdmin = currentUser.role === 'superadmin'
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Filtrar FAQ basado en rol del usuario
  const filteredFAQ = faqData.filter(item => {
    // Si es solo para superadmin y el usuario no es superadmin, no mostrar
    if (item.superAdminOnly && !isSuperAdmin) return false
    // Si es solo para admin y el usuario no es admin ni superadmin, no mostrar
    if (item.adminOnly && currentUser.role === 'user') return false
    
    return true
  })
  
  // Filtrar por búsqueda y categoría
  const displayedFAQ = filteredFAQ.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  // Obtener categorías únicas disponibles para el usuario
  const availableCategories = Array.from(new Set(['Todas', ...filteredFAQ.map(item => item.category)]))
  
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manual de Usuario
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Guía completa para usar Super Dinámico - Encuentra respuestas a todas tus preguntas sobre la plataforma
          </p>
          
          {/* Indicador de rol */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {isSuperAdmin ? 'Super Administrador' : 'Administrador'} - Acceso a {filteredFAQ.length} guías
            </span>
          </div>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar en el manual..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* Filtro de Categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              {/* Toggle de Vista */}
              <div className="flex bg-white/50 backdrop-blur-sm rounded-xl p-1 border border-white/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Cards/List */}
        <div className="max-w-6xl mx-auto">
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedFAQ.map((faq) => {
                const IconComponent = faq.icon
                
                return (
                  <button
                    key={faq.id}
                    onClick={() => setSelectedFAQ(faq)}
                    className="group relative bg-white/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/60 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full"
                  >
                    {/* Indicador de rol especial */}
                    {faq.superAdminOnly && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        SUPER ADMIN
                      </div>
                    )}
                    
                    {/* Icono y Categoría */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                          {faq.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Pregunta */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {faq.question}
                    </h3>
                    
                    {/* Respuesta */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                      {faq.answer}
                    </p>
                    
                    {/* Botón expandir */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 transition-colors">
                        <HelpCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Ver detalles completos</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    {/* Efecto glassmorphism adicional */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedFAQ.map((faq) => {
                const IconComponent = faq.icon
                
                return (
                  <button
                    key={faq.id}
                    onClick={() => setSelectedFAQ(faq)}
                    className="group relative bg-white/40 backdrop-blur-xl rounded-xl border border-white/20 p-6 hover:bg-white/60 hover:border-white/40 transition-all duration-300 hover:shadow-lg text-left w-full"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icono */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                            {faq.category}
                          </span>
                          {faq.superAdminOnly && (
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                          {faq.question}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>
                      
                      {/* Botón expandir */}
                      <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0">
                        <span className="text-sm font-medium hidden sm:inline">Ver detalles</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          
          {/* No results message */}
          {displayedFAQ.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Intenta con otros términos de búsqueda o selecciona una categoría diferente
              </p>
            </div>
          )}
        </div>

        {/* Sección de ayuda adicional */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              ¿Necesitas ayuda personalizada?
            </h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Si no encuentras la respuesta que buscas, nuestro equipo de soporte está disponible para ayudarte con cualquier duda específica sobre el uso de Super Dinámico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:soporte@cliquealo.mx"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              >
                Contactar Soporte
              </a>
              <a
                href="/admin/settings"
                className="bg-white text-blue-600 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              >
                Ver Configuraciones
              </a>
            </div>
          </div>
        </div>

        {/* Modal Detallado */}
        {selectedFAQ && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedFAQ(null)}
              />
              
              {/* Modal Content */}
              <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        {React.createElement(selectedFAQ.icon, { className: "w-6 h-6 text-white" })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">
                            {selectedFAQ.category}
                          </span>
                          {selectedFAQ.superAdminOnly && (
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs px-2 py-1 rounded-full font-semibold">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-white">
                          {selectedFAQ.question}
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFAQ(null)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {selectedFAQ.detailedContent ? (
                    <div className="space-y-8">
                      {/* Overview */}
                      <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
                        <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Visión General
                        </h3>
                        <p className="text-blue-800 leading-relaxed">
                          {selectedFAQ.detailedContent.overview}
                        </p>
                      </div>

                      {/* Steps */}
                      {selectedFAQ.detailedContent.steps && (
                        <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-6 border border-green-200/50">
                          <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Proceso Paso a Paso
                          </h3>
                          <div className="space-y-4">
                            {selectedFAQ.detailedContent.steps.map((step, index) => (
                              <div key={index} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-green-200/30">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                  <step.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-green-900 mb-1">
                                    {index + 1}. {step.title}
                                  </h4>
                                  <p className="text-green-800 text-sm leading-relaxed">
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Requirements */}
                      {selectedFAQ.detailedContent.requirements && (
                        <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50">
                          <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Requisitos Obligatorios
                          </h3>
                          <div className="grid gap-3">
                            {selectedFAQ.detailedContent.requirements.map((req, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-purple-200/30">
                                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                <span className="text-purple-800 text-sm leading-relaxed">{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Legal Obligations */}
                      {selectedFAQ.detailedContent.legalObligations && (
                        <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50">
                          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <Scale className="w-5 h-5" />
                            Obligaciones Legales
                          </h3>
                          <div className="grid gap-3">
                            {selectedFAQ.detailedContent.legalObligations.map((obligation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-amber-200/30">
                                <Scale className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span className="text-amber-800 text-sm leading-relaxed">{obligation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risks */}
                      {selectedFAQ.detailedContent.risks && (
                        <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-6 border border-red-200/50">
                          <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Riesgos y Precauciones
                          </h3>
                          <div className="grid gap-3">
                            {selectedFAQ.detailedContent.risks.map((risk, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-red-200/30">
                                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <span className="text-red-800 text-sm leading-relaxed">{risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Warnings */}
                      {selectedFAQ.detailedContent.warnings && (
                        <div className="bg-orange-50/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50">
                          <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Advertencias Importantes
                          </h3>
                          <div className="grid gap-3">
                            {selectedFAQ.detailedContent.warnings.map((warning, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-orange-200/30">
                                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                <span className="text-orange-800 text-sm font-medium leading-relaxed">{warning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Best Practices */}
                      {selectedFAQ.detailedContent.bestPractices && (
                        <div className="bg-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200/50">
                          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Mejores Prácticas
                          </h3>
                          <div className="grid gap-3">
                            {selectedFAQ.detailedContent.bestPractices.map((practice, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-indigo-200/30">
                                <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <span className="text-indigo-800 text-sm leading-relaxed">{practice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documentation */}
                      {selectedFAQ.detailedContent.documentation && (
                        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Documentación Requerida
                          </h3>
                          <div className="grid gap-3">
                            {selectedFAQ.detailedContent.documentation.map((doc, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-gray-200/30">
                                <FileText className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-800 text-sm leading-relaxed">{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ayuda Rápida por Módulo */}
                      {selectedFAQ.id === 'contracts-compraventa' && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-300/50 shadow-lg">
                          <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Checklist Rápido - Compraventa
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-green-800 text-sm uppercase tracking-wide">ANTES DE LA CITA</h4>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Verificar documentos en REPUVE</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Confirmar que no hay adeudos</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Validar identidad del vendedor</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Calcular impuestos aplicables</span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold text-green-800 text-sm uppercase tracking-wide">DURANTE LA FIRMA</h4>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Leer contrato completo con cliente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Verificar datos exactos del vehículo</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Confirmar método y monto de pago</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-green-600" />
                                  <span className="text-green-800">Tomar fotos de documentos</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-green-100/60 rounded-lg border border-green-200">
                            <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Tip: Siempre usa el sistema interno para generar el contrato y evitar errores manuales
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedFAQ.id === 'contracts-apartado' && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-300/50 shadow-lg">
                          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Checklist Rápido - Apartado
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">AL RECIBIR APARTADO</h4>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Verificar capacidad de pago del cliente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Establecer plazo máximo (30 días)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Documentar enganche mínimo 10%</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Apartar el vehículo en sistema</span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">SEGUIMIENTO DIARIO</h4>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Contactar cliente cada 3 días</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Verificar avance en documentos</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Actualizar estatus en CRM</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-blue-600" />
                                  <span className="text-blue-800">Preparar próximos pasos</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-blue-100/60 rounded-lg border border-blue-200">
                            <p className="text-blue-800 text-sm font-medium flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Importante: El apartado NO es venta final. Mantén comunicación constante.
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedFAQ.id === 'contracts-consignacion' && (
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-300/50 shadow-lg">
                          <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-purple-600" />
                            Checklist Rápido - Consignación
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-purple-800 text-sm uppercase tracking-wide">AL RECIBIR VEHÍCULO</h4>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Inspección física completa + fotos</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Verificar documentos originales</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Confirmar libre de gravamen</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Avalúo por perito certificado</span>
                                </label>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold text-purple-800 text-sm uppercase tracking-wide">DURANTE LA VENTA</h4>
                              <div className="space-y-2 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Mantener seguro vigente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Reportes mensuales al propietario</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Documentar todas las gestiones</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" className="rounded text-purple-600" />
                                  <span className="text-purple-800">Liquidación inmediata post-venta</span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-purple-100/60 rounded-lg border border-purple-200">
                            <p className="text-purple-800 text-sm font-medium flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Crítico: Eres responsable del vehículo hasta entregarlo al nuevo propietario.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Ayuda Rápida para otros módulos principales */}
                      {selectedFAQ.category === 'Gestión de Listings' && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-300/50 shadow-lg">
                          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5 text-amber-600" />
                            Checklist Rápido - Gestión de Listings
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2 text-sm">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-amber-600" />
                                <span className="text-amber-800">Fotos: mínimo 8, máximo 15</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-amber-600" />
                                <span className="text-amber-800">Descripción detallada y honesta</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-amber-600" />
                                <span className="text-amber-800">Precio competitivo vs. mercado</span>
                              </label>
                            </div>
                            <div className="space-y-2 text-sm">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-amber-600" />
                                <span className="text-amber-800">Verificar documentos legales</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-amber-600" />
                                <span className="text-amber-800">Actualizar status diariamente</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-amber-600" />
                                <span className="text-amber-800">Responder consultas en menos de 2hrs</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedFAQ.category === 'Solicitudes de Crédito' && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-300/50 shadow-lg">
                          <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-emerald-600" />
                            Checklist Rápido - Solicitudes de Crédito
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2 text-sm">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" />
                                <span className="text-emerald-800">Verificar ingresos comprobables</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" />
                                <span className="text-emerald-800">Validar historial crediticio</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" />
                                <span className="text-emerald-800">Calcular capacidad de pago 30%</span>
                              </label>
                            </div>
                            <div className="space-y-2 text-sm">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" />
                                <span className="text-emerald-800">Revisar documentos completos</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" />
                                <span className="text-emerald-800">Contactar referencias laborales</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-emerald-600" />
                                <span className="text-emerald-800">Respuesta en máximo 48hrs</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback para FAQs sin contenido detallado */
                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                      <p className="text-gray-800 leading-relaxed text-lg">
                        {selectedFAQ.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}