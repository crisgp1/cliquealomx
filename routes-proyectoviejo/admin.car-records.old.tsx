import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit, Form, Link } from '@remix-run/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Filter,
  Check,
  X,
  Eye,
  Download,
  Folder,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { 
  Input as HeroInput,
  Button as HeroButton,
  Chip,
  Card as HeroCard,
  CardBody,
  Divider,
  ButtonGroup
} from '@heroui/react';
import { requireClerkSuperAdmin } from '~/lib/auth-clerk.server';
import { CarRecordModel, type CreateCarRecordData } from '~/models/CarRecord.server';
import { AdminLayout } from '~/components/admin/AdminLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Badge } from '~/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '~/components/ui/dialog';
import { MediaUpload, type MediaItem } from '~/components/ui/media-upload';
import { PreviewModal } from '~/components/modals/preview-modal';
import { ViewModal } from '~/components/modals/view-modal';

export const loader = async (args: LoaderFunctionArgs) => {
  const user = await requireClerkSuperAdmin(args);
  
  const url = new URL(args.request.url);
  const searchParams = url.searchParams;
  const search = searchParams.get('search') || undefined;
  const isSaleFilter = searchParams.get('isSale');
  const isSale = isSaleFilter === 'true' ? true : isSaleFilter === 'false' ? false : undefined;
  
  console.log('Loading car records with filters:', { search, isSale });
  
  const [carRecords, stats] = await Promise.all([
    CarRecordModel.findMany({ search, isSale, limit: 50 }),
    CarRecordModel.getStats()
  ]);

  console.log('Loaded records:', carRecords.length, 'Stats:', stats);

  return json({ carRecords, stats, currentUser: user });
};

export const action = async (args: ActionFunctionArgs) => {
  const user = await requireClerkSuperAdmin(args);
  
  const formData = await args.request.formData();
  const intent = formData.get('intent');

  if (intent === 'create') {
    const title = formData.get('title') as string;
    const isSale = formData.get('isSale') === 'true';
    const notes = formData.get('notes') as string;
    const documentsJson = formData.get('documents') as string;
    const saleDataJson = formData.get('saleData') as string;
    
    console.log('Creating car record with data:', {
      title,
      isSale,
      notes,
      documentsJson: documentsJson?.substring(0, 100) + '...',
      saleDataJson: saleDataJson?.substring(0, 100) + '...'
    });
    
    if (!title || !documentsJson) {
      return json({ error: 'Título y documentos son requeridos' }, { status: 400 });
    }

    try {
      const mediaItems = JSON.parse(documentsJson) as MediaItem[];
      
      const documents = mediaItems.map(item => ({
        name: item.name || 'Documento',
        url: item.url,
        type: (item.url.toLowerCase().includes('.pdf') ? 'pdf' : 'image') as 'image' | 'pdf',
        size: item.size
      }));

      const carRecordData: CreateCarRecordData = {
        title,
        isSale,
        notes: notes || undefined,
        documents,
        createdBy: user._id!.toString()
      };

      // Add sale data if it's a sale
      if (isSale && saleDataJson) {
        try {
          carRecordData.saleData = JSON.parse(saleDataJson);
          console.log('Sale data parsed successfully:', carRecordData.saleData);
        } catch (e) {
          console.error('Error parsing sale data:', e);
        }
      }

      console.log('Creating record with data:', carRecordData);
      const result = await CarRecordModel.create(carRecordData);
      console.log('Record created successfully:', result._id);
      
      return json({ success: true, message: 'Expediente creado exitosamente' });
    } catch (error) {
      console.error('Error creating car record:', error);
      return json({ error: 'Error al crear el expediente' }, { status: 500 });
    }
  }

  return json({ error: 'Acción inválida' }, { status: 400 });
};

export default function CarRecords() {
  const { carRecords, stats } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSales, setFilterSales] = useState<boolean | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState('');
  const [isSale, setIsSale] = useState(false);
  const [notes, setNotes] = useState('');
  const [previewExpedientNumber, setPreviewExpedientNumber] = useState('');
  
  // Sale-specific data
  const [vehicleData, setVehicleData] = useState({
    brand: '',
    model: '',
    serialNumber: ''
  });
  const [customerData, setCustomerData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    idNumber: ''
  });
  const [sellerData, setSellerData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    idNumber: ''
  });

  const generatePreviewExpedientNumber = () => {
    const year = new Date().getFullYear();
    const count = stats.total + 1;
    return `EXP-${year}-${count.toString().padStart(6, '0')}`;
  };

  const handlePreview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Preview form data:', {
      title,
      notes,
      isSale,
      documents: documents.length,
      vehicleData,
      customerData
    });
    
    if (!title.trim() || documents.length === 0) {
      console.log('Validation failed: missing title or documents');
      return;
    }
    
    // Validate sale-specific fields if it's a sale
    if (isSale) {
      if (!vehicleData.brand.trim() || !vehicleData.model.trim() || !customerData.name.trim() || !sellerData.name.trim()) {
        console.log('Validation failed: missing sale data');
        return; // Form validation will handle the display
      }
    }
    
    const expedientNumber = generatePreviewExpedientNumber();
    setPreviewExpedientNumber(expedientNumber);
    setIsPreviewOpen(true);
  };

  const handleConfirmSave = () => {
    const formData = new FormData();
    
    formData.append('intent', 'create');
    formData.append('title', title);
    formData.append('isSale', isSale.toString());
    formData.append('notes', notes);
    formData.append('documents', JSON.stringify(documents));
    
    // Add sale data if it's a sale
    if (isSale) {
      const saleData = {
        vehicle: vehicleData,
        customer: customerData,
        seller: sellerData
      };
      formData.append('saleData', JSON.stringify(saleData));
      console.log('Sending sale data:', saleData);
    }
    
    console.log('Submitting form with data:', {
      title,
      isSale,
      notes,
      documentsCount: documents.length
    });
    
    submit(formData, { method: 'post' });
    setIsDialogOpen(false);
    setIsPreviewOpen(false);
    setDocuments([]);
    setTitle('');
    setNotes('');
    setIsSale(false);
    setVehicleData({ brand: '', model: '', serialNumber: '' });
    setCustomerData({ name: '', address: '', email: '', phone: '', idNumber: '' });
    setSellerData({ name: '', address: '', email: '', phone: '', idNumber: '' });
    setPreviewExpedientNumber('');
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (searchTerm) searchParams.set('search', searchTerm);
    if (filterSales !== null) searchParams.set('isSale', filterSales.toString());
    
    console.log('Searching with params:', Object.fromEntries(searchParams));
    submit(searchParams, { method: 'get', replace: true });
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expedientes de Autos</h1>
          <p className="text-gray-600">
            Gestiona documentos de autos vendidos con el modelo legacy
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expedientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Expedientes registrados
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sales}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Check className="w-4 h-4 mr-1" />
                  {stats.total > 0 ? Math.round((stats.sales / stats.total) * 100) : 0}% del total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Otros Documentos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.other}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <FileText className="w-4 h-4 mr-1" />
                  {stats.total > 0 ? Math.round((stats.other / stats.total) * 100) : 0}% del total
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documentos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Upload className="w-4 h-4 mr-1" />
                  Archivos subidos
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Expediente
              </Button>
            </DialogTrigger>
            
            <DialogContent className={`${isSale ? 'sm:max-w-4xl' : 'sm:max-w-md'} max-h-[90vh] overflow-y-auto z-[999]`}>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Expediente</DialogTitle>
              </DialogHeader>
              
              <Form onSubmit={handlePreview} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Expediente</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Honda Accord 2018 - Documentos de Venta"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas Marginales
                  <span className="text-xs text-gray-500">(Opcional)</span>
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregue comentarios adicionales, observaciones importantes, o cualquier información relevante sobre este expediente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px] max-h-[200px]"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Estas notas aparecerán en el expediente y pueden incluir información sobre el estado del trámite, 
                  pendientes, o cualquier detalle importante.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isSale"
                  checked={isSale}
                  onChange={(e) => setIsSale(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isSale">Corresponde a una venta</Label>
              </div>

              {/* Sale-specific fields */}
              <AnimatePresence>
                {isSale && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Check className="w-4 h-4 text-blue-600" />
                        </div>
                        Datos de la Compraventa
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Vehicle Data Section */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Datos del Vehículo
                            </h5>
                            
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="vehicleBrand">Marca *</Label>
                                <Input
                                  id="vehicleBrand"
                                  value={vehicleData.brand}
                                  onChange={(e) => setVehicleData({...vehicleData, brand: e.target.value})}
                                  placeholder="ej. Toyota, Honda, Ford"
                                  required={isSale}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="vehicleModel">Modelo *</Label>
                                <Input
                                  id="vehicleModel"
                                  value={vehicleData.model}
                                  onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                                  placeholder="ej. Corolla, Civic, F-150"
                                  required={isSale}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="vehicleSerial">Número de Serie / NIV</Label>
                                <Input
                                  id="vehicleSerial"
                                  value={vehicleData.serialNumber}
                                  onChange={(e) => setVehicleData({...vehicleData, serialNumber: e.target.value})}
                                  placeholder="Número de identificación vehicular"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customer Data Section */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                              <Folder className="w-4 h-4 mr-2" />
                              Datos del Comprador
                            </h5>
                            
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="customerName">Nombre Completo *</Label>
                                <Input
                                  id="customerName"
                                  value={customerData.name}
                                  onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                                  placeholder="Nombre completo del comprador"
                                  required={isSale}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="customerAddress">Dirección</Label>
                                <Input
                                  id="customerAddress"
                                  value={customerData.address}
                                  onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                                  placeholder="Dirección completa"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="customerEmail">Correo Electrónico</Label>
                                <Input
                                  id="customerEmail"
                                  type="email"
                                  value={customerData.email}
                                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                                  placeholder="email@ejemplo.com"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="customerPhone">Teléfono</Label>
                                <Input
                                  id="customerPhone"
                                  value={customerData.phone}
                                  onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                                  placeholder="Número de teléfono"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="customerIdNumber">Número de Identificación</Label>
                                <Input
                                  id="customerIdNumber"
                                  value={customerData.idNumber}
                                  onChange={(e) => setCustomerData({...customerData, idNumber: e.target.value})}
                                  placeholder="INE, RFC, Pasaporte, etc."
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seller Data Section */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                              <Folder className="w-4 h-4 mr-2" />
                              Datos del Vendedor
                            </h5>
                            
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="sellerName">Nombre Completo *</Label>
                                <Input
                                  id="sellerName"
                                  value={sellerData.name}
                                  onChange={(e) => setSellerData({...sellerData, name: e.target.value})}
                                  placeholder="Nombre completo del vendedor"
                                  required={isSale}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="sellerAddress">Dirección</Label>
                                <Input
                                  id="sellerAddress"
                                  value={sellerData.address}
                                  onChange={(e) => setSellerData({...sellerData, address: e.target.value})}
                                  placeholder="Dirección completa"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="sellerEmail">Correo Electrónico</Label>
                                <Input
                                  id="sellerEmail"
                                  type="email"
                                  value={sellerData.email}
                                  onChange={(e) => setSellerData({...sellerData, email: e.target.value})}
                                  placeholder="email@ejemplo.com"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="sellerPhone">Teléfono</Label>
                                <Input
                                  id="sellerPhone"
                                  value={sellerData.phone}
                                  onChange={(e) => setSellerData({...sellerData, phone: e.target.value})}
                                  placeholder="Número de teléfono"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="sellerIdNumber">Número de Identificación</Label>
                                <Input
                                  id="sellerIdNumber"
                                  value={sellerData.idNumber}
                                  onChange={(e) => setSellerData({...sellerData, idNumber: e.target.value})}
                                  placeholder="INE, RFC, Pasaporte, etc."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-2">
                <MediaUpload
                  label="Documentos del Expediente"
                  onMediaChange={setDocuments}
                  initialMedia={documents}
                  maxFiles={20}
                  accept={{
                    "image/jpeg": [".jpeg", ".jpg"],
                    "image/png": [".png"],
                    "image/webp": [".webp"],
                    "application/pdf": [".pdf"]
                  }}
                  maxSize={10 * 1024 * 1024} // 10MB
                  allowVideos={false}
                  uploadEndpoint="/api/upload-document"
                  uploadMode="inline"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setDocuments([]);
                    setTitle('');
                    setNotes('');
                    setIsSale(false);
                    setVehicleData({ brand: '', model: '', serialNumber: '' });
                    setCustomerData({ name: '', address: '', email: '', phone: '', idNumber: '' });
                    setSellerData({ name: '', address: '', email: '', phone: '', idNumber: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !title.trim() || 
                    documents.length === 0 || 
                    (isSale && (!vehicleData.brand.trim() || !vehicleData.model.trim() || !customerData.name.trim() || !sellerData.name.trim()))
                  }
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Previsualizar Expediente
                </Button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onConfirm={handleConfirmSave}
          data={{
            expedientNumber: previewExpedientNumber,
            title,
            isSale,
            notes,
            documents,
            vehicleData,
            customerData,
            sellerData
          }}
        />

        {/* View Expedient Modal */}
        <ViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
        />
      </div>

        {/* Modern Search & Filters with HeroUI */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
          className="mt-8"
        >
          <HeroCard className="backdrop-blur-md bg-gradient-to-br from-white/95 to-blue-50/30 border-0 shadow-2xl shadow-blue-500/10">
            <CardBody className="p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-8"
              >
                {/* Advanced Search Section */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-3 mb-6"
                  >
                    <motion.div
                      animate={{ 
                        rotate: searchTerm ? 180 : 0,
                        scale: searchTerm ? 1.1 : 1
                      }}
                      transition={{ duration: 0.3 }}
                      className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                    >
                      <Search className="w-5 h-5 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Buscar Expedientes
                      </h3>
                      <p className="text-sm text-gray-500">Encuentra documentos por título o tipo</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.01 }}
                    className="relative"
                  >
                    <HeroInput
                      placeholder="Buscar por título, documentos, tipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      startContent={
                        <motion.div
                          animate={{ 
                            color: searchTerm ? '#3b82f6' : '#9ca3af',
                            scale: searchTerm ? 1.1 : 1
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <Search className="w-4 h-4" />
                        </motion.div>
                      }
                      endContent={
                        <AnimatePresence>
                          {searchTerm && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0, rotate: -90 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0, rotate: 90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <HeroButton
                                isIconOnly
                                variant="light"
                                size="sm"
                                onClick={() => {
                                  setSearchTerm('');
                                  handleSearch();
                                }}
                                className="min-w-unit-6 w-6 h-6"
                              >
                                <X className="w-3 h-3" />
                              </HeroButton>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      }
                      size="lg"
                      radius="lg"
                      variant="bordered"
                      className="text-base"
                      classNames={{
                        input: "text-base",
                        inputWrapper: "border-2 border-gray-200 hover:border-blue-400 focus-within:border-blue-500 bg-white/80 backdrop-blur-sm shadow-lg"
                      }}
                    />
                    
                    {/* Search suggestions or quick actions could go here */}
                    <AnimatePresence>
                      {searchTerm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full left-0 right-0 mt-2 p-3 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-xl z-10"
                        >
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Search className="w-4 h-4" />
                            <span>Presiona Enter para buscar o</span>
                            <HeroButton
                              size="sm"
                              variant="flat"
                              color="primary"
                              onClick={handleSearch}
                              className="h-6 min-w-unit-16"
                            >
                              Buscar ahora
                            </HeroButton>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <Divider className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                {/* Enhanced Filter Section */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      animate={{ rotate: filterSales !== null ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md"
                    >
                      <Filter className="w-4 h-4 text-white" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Filtros Inteligentes</h4>
                      <p className="text-xs text-gray-500">Filtra por tipo de documento</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-wrap gap-3"
                  >
                    <ButtonGroup variant="flat" radius="lg" className="bg-white/50 backdrop-blur-sm">
                      {[
                        { key: null, label: 'Todos', count: stats.total, color: 'default', gradient: 'from-slate-500 to-gray-600', icon: Folder },
                        { key: true, label: 'Ventas', count: stats.sales, color: 'success', gradient: 'from-emerald-500 to-green-600', icon: Check },
                        { key: false, label: 'Otros', count: stats.other, color: 'warning', gradient: 'from-amber-500 to-orange-600', icon: FileText }
                      ].map((filter, index) => {
                        const isActive = filterSales === filter.key;
                        const Icon = filter.icon;
                        
                        return (
                          <motion.div
                            key={filter.label}
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              delay: 0.8 + index * 0.1,
                              type: "spring",
                              stiffness: 200,
                              damping: 20
                            }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <HeroButton
                              onClick={() => {
                                setFilterSales(filter.key);
                                handleSearch();
                              }}
                              variant={isActive ? "solid" : "bordered"}
                              color={isActive ? filter.color : "default"}
                              size="lg"
                              radius="lg"
                              startContent={
                                <motion.div
                                  animate={{ 
                                    scale: isActive ? 1.2 : 1,
                                    rotate: isActive ? 360 : 0
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Icon className="w-4 h-4" />
                                </motion.div>
                              }
                              endContent={
                                <motion.div
                                  animate={{ 
                                    scale: isActive ? 1.1 : 1,
                                    opacity: isActive ? 1 : 0.7
                                  }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Chip 
                                    size="sm" 
                                    variant={isActive ? "solid" : "flat"}
                                    color={isActive ? "default" : filter.color}
                                    className={isActive ? "bg-white/20 text-white" : ""}
                                  >
                                    {filter.count}
                                  </Chip>
                                </motion.div>
                              }
                              className={`
                                min-w-[140px] h-12 font-semibold transition-all duration-300
                                ${isActive 
                                  ? `bg-gradient-to-r ${filter.gradient} shadow-lg shadow-${filter.color}-500/25 text-white border-0` 
                                  : 'bg-white/70 hover:bg-white/90 border-gray-200 hover:border-gray-300 backdrop-blur-sm'
                                }
                              `}
                            >
                              {filter.label}
                              
                              {/* Shimmer effect for active state */}
                              <AnimatePresence>
                                {isActive && (
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    exit={{ opacity: 0 }}
                                    transition={{ 
                                      duration: 0.8,
                                      ease: "easeInOut",
                                      repeat: Infinity,
                                      repeatDelay: 3
                                    }}
                                  />
                                )}
                              </AnimatePresence>
                            </HeroButton>
                          </motion.div>
                        );
                      })}
                    </ButtonGroup>
                  </motion.div>
                </div>

                <Divider className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

                {/* Results Summary & Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <motion.div
                    className="flex items-center gap-3"
                    key={carRecords.length}
                    initial={{ scale: 1.1, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                      <Folder className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {carRecords.length} resultado{carRecords.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {carRecords.length === 0 ? 'No se encontraron expedientes' : 
                         carRecords.length === stats.total ? 'Mostrando todos los expedientes' :
                         'Expedientes filtrados'}
                      </p>
                    </div>
                  </motion.div>
                  
                  <AnimatePresence>
                    {(searchTerm || filterSales !== null) && (
                      <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <HeroButton
                          onClick={() => {
                            setSearchTerm('');
                            setFilterSales(null);
                            handleSearch();
                          }}
                          variant="flat"
                          color="danger"
                          startContent={<X className="w-4 h-4" />}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300"
                        >
                          Limpiar filtros
                        </HeroButton>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </CardBody>
          </HeroCard>
        </motion.div>

        {/* Records Grid with Motion */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <AnimatePresence>
            {carRecords.map((record: any, index: number) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                whileHover={{ 
                  scale: 1.02,
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                layout
              >
                <Card className="h-full bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {record.expedientNumber || 'SIN-NUM'}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {record.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Subido el {new Date(record.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <Badge variant={record.isSale ? 'default' : 'secondary'}>
                  {record.isSale ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Venta
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      Otro
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Marginal Notes */}
                {record.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-800 mb-1 flex items-center">
                      <FileText className="w-3 h-3 mr-1" />
                      Notas Marginales
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed line-clamp-2">
                      {record.notes}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Documentos ({record.documents.length})
                  </p>
                  <div className="space-y-1">
                    {record.documents.slice(0, 3).map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 truncate flex-1 flex items-center">
                          {doc.type === 'pdf' ? (
                            <FileText className="w-4 h-4 mr-1 text-red-600" />
                          ) : (
                            <Eye className="w-4 h-4 mr-1 text-blue-600" />
                          )}
                          {doc.name}
                        </span>
                        <div className="flex space-x-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = doc.url;
                              a.download = doc.name;
                              a.click();
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {record.documents.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{record.documents.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsViewModalOpen(true);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Expediente Completo
                  </Button>
                </div>
              </div>
            </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {carRecords.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              >
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <motion.h3 
                className="text-lg font-medium text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                No se encontraron expedientes
              </motion.h3>
              <motion.p 
                className="text-gray-500 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {searchTerm || filterSales !== null 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza creando tu primer expediente de auto'
                }
              </motion.p>
              {!searchTerm && filterSales === null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Expediente
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}