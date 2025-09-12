import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useActionData, Form, Link } from "@remix-run/react"
import { useState } from "react"
import { requireClerkSuperAdmin } from "~/lib/auth-clerk.server"
import { BankPartnerModel } from "~/models/BankPartner.server"
import { AdminLayout } from "~/components/admin/AdminLayout"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Card } from "~/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { ConfirmDialog } from "~/components/ui/confirm-dialog"
import { toast } from "~/components/ui/toast"
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Percent,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  Flag,
  Clock,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkSuperAdmin(args)
  
  const url = new URL(args.request.url)
  const search = url.searchParams.get("search") || ""
  const isActive = url.searchParams.get("active")
  
  const filters: any = {}
  if (search) filters.search = search
  if (isActive !== null) filters.isActive = isActive === "true"
  
  const [partners, stats] = await Promise.all([
    BankPartnerModel.findAll(filters),
    BankPartnerModel.getStats()
  ])
  
  return json({ partners, stats, currentUser: user, search, isActive })
}

export async function action(args: ActionFunctionArgs) {
  const user = await requireClerkSuperAdmin(args)
  const formData = await args.request.formData()
  const intent = formData.get("intent")
  
  try {
    switch (intent) {
      case "create": {
        const partnerData = {
          name: formData.get("name") as string,
          logo: formData.get("logo") as string || undefined,
          creditRate: parseFloat(formData.get("creditRate") as string),
          minTerm: parseInt(formData.get("minTerm") as string),
          maxTerm: parseInt(formData.get("maxTerm") as string),
          minVehicleYear: formData.get("minVehicleYear") ? parseInt(formData.get("minVehicleYear") as string) : undefined,
          requirements: (formData.get("requirements") as string).split('\n').filter(r => r.trim()),
          processingTime: parseInt(formData.get("processingTime") as string),
          isActive: formData.get("isActive") === "true",
          contactInfo: {
            phone: formData.get("phone") as string || undefined,
            email: formData.get("email") as string || undefined,
            website: formData.get("website") as string || undefined,
          },
        }
        
        await BankPartnerModel.create({
          ...partnerData,
          createdBy: user._id!
        })
        return json({ success: true, message: "Aliado bancario creado exitosamente" })
      }
      
      case "update": {
        const id = formData.get("id") as string
        const creditRate = parseFloat(formData.get("creditRate") as string)
        const minVehicleYear = formData.get("minVehicleYear") ? parseInt(formData.get("minVehicleYear") as string) : undefined
        const isActive = formData.get("isActive") === "true"
        
        await BankPartnerModel.update(id, { creditRate, minVehicleYear, isActive })
        return json({ success: true, message: "Aliado bancario actualizado exitosamente" })
      }
      
      case "updateRate": {
        const id = formData.get("id") as string
        const creditRate = parseFloat(formData.get("creditRate") as string)
        
        await BankPartnerModel.updateCreditRate(id, creditRate)
        return json({ success: true, message: "Tasa de interés actualizada exitosamente" })
      }
      
      case "toggle": {
        const id = formData.get("id") as string
        await BankPartnerModel.toggleActive(id)
        return json({ success: true, message: "Estado actualizado exitosamente" })
      }
      
      case "delete": {
        const id = formData.get("id") as string
        await BankPartnerModel.delete(id)
        return json({ success: true, message: "Aliado bancario eliminado exitosamente" })
      }

      case "reportIncident": {
        const bankPartnerId = formData.get("bankPartnerId") as string
        const type = formData.get("type") as any
        const description = formData.get("description") as string
        const severity = formData.get("severity") as any
        
        await BankPartnerModel.reportIncident(bankPartnerId, {
          type,
          description,
          severity,
          reportedBy: user._id!
        })
        return json({ success: true, message: "Incidencia reportada exitosamente" })
      }

      case "resolveIncident": {
        const bankPartnerId = formData.get("bankPartnerId") as string
        const incidentId = formData.get("incidentId") as string
        const notes = formData.get("notes") as string
        
        await BankPartnerModel.resolveIncident(bankPartnerId, incidentId, user._id!, notes)
        return json({ success: true, message: "Incidencia resuelta exitosamente" })
      }
      
      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in bank partners action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export default function AdminBankPartners() {
  const { partners, stats, currentUser, search, isActive } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingPartner, setEditingPartner] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [reportingIncident, setReportingIncident] = useState<any>(null)
  const [viewingIncidents, setViewingIncidents] = useState<any>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatRate = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Aliados Bancarios
            </h1>
            <p className="text-gray-600">
              Gestiona los bancos aliados y sus tasas de crédito
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Aliado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Aliados</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Todos los bancos
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Disponibles
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa Promedio</p>
                <p className="text-3xl font-bold text-gray-900">{formatRate(stats.avgRate)}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Percent className="w-4 h-4 mr-1" />
                  Anual
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mejor Tasa</p>
                <p className="text-3xl font-bold text-gray-900">{formatRate(stats.minRate)}</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Más competitiva
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incidencias Activas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {partners.reduce((total: number, partner: any) => 
                    total + (partner.incidents?.filter((i: any) => !i.resolved).length || 0), 0
                  )}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Por resolver
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Flag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <Form method="get" className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  name="search"
                  placeholder="Buscar por nombre o email..."
                  defaultValue={search}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="active">Estado</Label>
              <select
                name="active"
                defaultValue={isActive || ""}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="outline">
                Filtrar
              </Button>
            </div>
          </Form>
        </Card>

        {/* Partners List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {partners.map((partner: any) => (
            <Card key={partner._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="w-12 h-12 rounded-lg object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      partner.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {partner.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="toggle" />
                    <input type="hidden" name="id" value={partner._id} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      title={partner.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {partner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </Form>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPartner(partner)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportingIncident(partner)}
                    title="Fichar - Reportar Incidencia"
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingIncidents(partner)}
                    title="Ver Incidencias"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(partner._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasa de Interés</span>
                  <span className="font-semibold text-lg text-green-600">
                    {formatRate(partner.creditRate)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Plazo</span>
                  <span className="text-sm font-medium">
                    {partner.minTerm} - {partner.maxTerm} meses
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Procesamiento</span>
                  <span className="text-sm font-medium">
                    {partner.processingTime} días
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Año Mínimo Vehículo</span>
                  <span className="text-sm font-medium">
                    {partner.minVehicleYear || 'Sin restricción'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Incidencias</span>
                  <div className="flex items-center gap-2">
                    {partner.incidents && partner.incidents.length > 0 ? (
                      <>
                        <span className="text-sm font-medium">
                          {partner.incidents.filter((i: any) => !i.resolved).length} activas
                        </span>
                        {partner.incidents.filter((i: any) => !i.resolved).length > 0 && (
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-green-600 font-medium">
                        Sin incidencias
                      </span>
                    )}
                  </div>
                </div>

                {partner.contactInfo && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {partner.contactInfo.phone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {partner.contactInfo.phone}
                        </div>
                      )}
                      {partner.contactInfo.email && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          {partner.contactInfo.email}
                        </div>
                      )}
                      {partner.contactInfo.website && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Globe className="w-3 h-3 mr-1" />
                          Sitio web
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {partners.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay aliados bancarios
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza agregando tu primer aliado bancario
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Aliado
            </Button>
          </div>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <BankPartnerDialog
            isOpen={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            partner={null}
            isEditing={false}
          />
        )}

        {/* Edit Rate Dialog */}
        {editingPartner && (
          <EditRateDialog
            isOpen={!!editingPartner}
            onClose={() => setEditingPartner(null)}
            partner={editingPartner}
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm) {
              const form = document.createElement('form')
              form.method = 'post'
              form.innerHTML = `
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="id" value="${deleteConfirm}" />
              `
              document.body.appendChild(form)
              form.submit()
              setDeleteConfirm(null)
            }
          }}
          title="Eliminar Aliado Bancario"
          description="¿Estás seguro de que quieres eliminar este aliado bancario? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          destructive={true}
        />

        {/* Report Incident Dialog */}
        {reportingIncident && (
          <ReportIncidentDialog
            isOpen={!!reportingIncident}
            onClose={() => setReportingIncident(null)}
            partner={reportingIncident}
          />
        )}

        {/* View Incidents Dialog */}
        {viewingIncidents && (
          <ViewIncidentsDialog
            isOpen={!!viewingIncidents}
            onClose={() => setViewingIncidents(null)}
            partner={viewingIncidents}
          />
        )}
      </div>
    </AdminLayout>
  )
}

function BankPartnerDialog({ 
  isOpen, 
  onClose, 
  partner, 
  isEditing 
}: { 
  isOpen: boolean
  onClose: () => void
  partner?: any
  isEditing: boolean
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Aliado Bancario</DialogTitle>
        </DialogHeader>
        <Form method="post" className="space-y-6">
        <input type="hidden" name="intent" value="create" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Nombre del Banco *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Banco Azteca"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="logo">URL del Logo</Label>
            <Input
              id="logo"
              name="logo"
              type="url"
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>
          
          <div>
            <Label htmlFor="creditRate">Tasa de Interés Anual (%) *</Label>
            <Input
              id="creditRate"
              name="creditRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="12.50"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="processingTime">Tiempo de Procesamiento (días) *</Label>
            <Input
              id="processingTime"
              name="processingTime"
              type="number"
              min="1"
              placeholder="5"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="minTerm">Plazo Mínimo (meses) *</Label>
            <Input
              id="minTerm"
              name="minTerm"
              type="number"
              min="1"
              placeholder="12"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="maxTerm">Plazo Máximo (meses) *</Label>
            <Input
              id="maxTerm"
              name="maxTerm"
              type="number"
              min="1"
              placeholder="72"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="minVehicleYear">Año Mínimo del Vehículo (opcional)</Label>
            <Input
              id="minVehicleYear"
              name="minVehicleYear"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              placeholder={`Ej: ${new Date().getFullYear() - 5}`}
            />
            <p className="text-sm text-gray-500 mt-1">
              Deja vacío para aceptar vehículos de cualquier año
            </p>
          </div>
        </div>
        
        <div>
          <Label htmlFor="requirements">Requisitos (uno por línea)</Label>
          <Textarea
            id="requirements"
            name="requirements"
            rows={4}
            placeholder="Identificación oficial&#10;Comprobante de ingresos&#10;Comprobante de domicilio"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="33 1234 5678"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contacto@banco.com"
            />
          </div>
          
          <div>
            <Label htmlFor="website">Sitio Web</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://banco.com"
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            value="true"
            defaultChecked={true}
            className="mr-2"
          />
          <Label htmlFor="isActive">Activo</Label>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Crear
          </Button>
        </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditRateDialog({
  isOpen,
  onClose,
  partner
}: {
  isOpen: boolean
  onClose: () => void
  partner: any
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Aliado Bancario - {partner?.name}</DialogTitle>
        </DialogHeader>
        <Form method="post" className="space-y-6">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="id" value={partner?._id} />
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Información del Banco</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Banco:</strong> {partner?.name}</p>
                <p><strong>Plazo:</strong> {partner?.minTerm} - {partner?.maxTerm} meses</p>
                <p><strong>Tasa Actual:</strong> {partner?.creditRate?.toFixed(2)}%</p>
                <p><strong>Año Mínimo Actual:</strong> {partner?.minVehicleYear || 'Sin restricción'}</p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="creditRate">Tasa de Interés Anual (%) *</Label>
              <Input
                id="creditRate"
                name="creditRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={partner?.creditRate}
                placeholder="12.50"
                required
                className="text-lg font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta tasa se aplicará a todas las nuevas simulaciones de crédito
              </p>
            </div>

            <div>
              <Label htmlFor="minVehicleYear">Año Mínimo del Vehículo</Label>
              <Input
                id="minVehicleYear"
                name="minVehicleYear"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                defaultValue={partner?.minVehicleYear || ''}
                placeholder={`Ej: ${new Date().getFullYear() - 5}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo financiará vehículos de este año o más recientes. Deja vacío para sin restricción.
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                value="true"
                defaultChecked={partner?.isActive ?? true}
                className="mr-2"
              />
              <Label htmlFor="isActive">Mantener banco activo</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Actualizar
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ReportIncidentDialog({
  isOpen,
  onClose,
  partner
}: {
  isOpen: boolean
  onClose: () => void
  partner: any
}) {
  const incidentTypes = [
    { value: 'tardanza', label: 'Tardanza en respuesta' },
    { value: 'no_respuesta', label: 'No da respuesta al cliente' },
    { value: 'mala_atencion', label: 'Mala atención al cliente' },
    { value: 'documentos_faltantes', label: 'Solicita documentos adicionales' },
    { value: 'proceso_lento', label: 'Proceso de aprobación lento' },
    { value: 'otro', label: 'Otro' }
  ]

  const severityLevels = [
    { value: 'baja', label: 'Baja', color: 'text-green-600' },
    { value: 'media', label: 'Media', color: 'text-yellow-600' },
    { value: 'alta', label: 'Alta', color: 'text-orange-600' },
    { value: 'critica', label: 'Crítica', color: 'text-red-600' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-orange-600" />
            Fichar - {partner?.name}
          </DialogTitle>
        </DialogHeader>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="reportIncident" />
          <input type="hidden" name="bankPartnerId" value={partner?._id} />
          
          <div>
            <Label htmlFor="type">Tipo de Incidencia *</Label>
            <select
              id="type"
              name="type"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Selecciona un tipo</option>
              {incidentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="severity">Severidad *</Label>
            <select
              id="severity"
              name="severity"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Selecciona severidad</option>
              {severityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Descripción de la Incidencia *</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe detalladamente qué ocurrió..."
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              <Flag className="w-4 h-4 mr-2" />
              Reportar Incidencia
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ViewIncidentsDialog({
  isOpen,
  onClose,
  partner
}: {
  isOpen: boolean
  onClose: () => void
  partner: any
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'baja': return 'bg-green-100 text-green-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'critica': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    const types: {[key: string]: string} = {
      'tardanza': 'Tardanza en respuesta',
      'no_respuesta': 'No da respuesta al cliente',
      'mala_atencion': 'Mala atención al cliente',
      'documentos_faltantes': 'Solicita documentos adicionales',
      'proceso_lento': 'Proceso de aprobación lento',
      'otro': 'Otro'
    }
    return types[type] || type
  }

  const incidents = partner?.incidents || []
  const unresolvedIncidents = incidents.filter((i: any) => !i.resolved)
  const resolvedIncidents = incidents.filter((i: any) => i.resolved)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Incidencias - {partner?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{unresolvedIncidents.length}</div>
                <div className="text-sm text-gray-600">Activas</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{resolvedIncidents.length}</div>
                <div className="text-sm text-gray-600">Resueltas</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{incidents.length}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </Card>
          </div>

          {/* Incidencias Activas */}
          {unresolvedIncidents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-3">
                Incidencias Activas ({unresolvedIncidents.length})
              </h3>
              <div className="space-y-3">
                {unresolvedIncidents.map((incident: any) => (
                  <Card key={incident._id} className="p-4 border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">
                          {getTypeLabel(incident.type)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(incident.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{incident.description}</p>
                    <Form method="post" className="flex gap-2">
                      <input type="hidden" name="intent" value="resolveIncident" />
                      <input type="hidden" name="bankPartnerId" value={partner._id} />
                      <input type="hidden" name="incidentId" value={incident._id} />
                      <Input
                        name="notes"
                        placeholder="Notas de resolución..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    </Form>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Incidencias Resueltas */}
          {resolvedIncidents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">
                Incidencias Resueltas ({resolvedIncidents.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {resolvedIncidents.map((incident: any) => (
                  <Card key={incident._id} className="p-4 border-green-200 bg-green-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">
                          {getTypeLabel(incident.type)}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-xs text-gray-500">
                        Resuelto: {new Date(incident.resolvedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{incident.description}</p>
                    {incident.notes && (
                      <p className="text-sm text-green-700 italic">
                        <strong>Resolución:</strong> {incident.notes}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {incidents.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sin incidencias
              </h3>
              <p className="text-gray-600">
                Este banco aliado no tiene incidencias reportadas
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}