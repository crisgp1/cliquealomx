import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSubmit, useActionData } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button,
  Card,
  CardBody,
  CardHeader,
  useDisclosure
} from '@heroui/react';
import { 
  Plus, 
  TrendingUp,
  Folder,
  Upload,
  Check,
  FileText
} from 'lucide-react';

import { requireClerkSuperAdmin } from '~/lib/auth-clerk.server';
import { CarRecordModel, type CreateCarRecordData } from '~/models/CarRecord.server';
import { AdminLayout } from '~/components/admin/AdminLayout';
import type { MediaItem } from '~/components/ui/media-upload';

// New HeroUI-based components
import { CarRecordCreationModal, type CarRecordFormData } from '~/components/car-records/CarRecordCreationModal';
import { CarRecordPreviewModal } from '~/components/car-records/CarRecordPreviewModal';
import { CarRecordViewModal } from '~/components/car-records/CarRecordViewModal';
import { CarRecordOrganizationModal, type OrganizationData } from '~/components/car-records/CarRecordOrganizationModal';
import { CarRecordCard } from '~/components/car-records/CarRecordCard';
import { CarRecordSearchBar } from '~/components/car-records/CarRecordSearchBar';
import { toast } from '~/components/ui/toast';

export const loader = async (args: LoaderFunctionArgs) => {
  const user = await requireClerkSuperAdmin(args);
  
  const url = new URL(args.request.url);
  const searchParams = url.searchParams;
  const search = searchParams.get('search') || undefined;
  const isSaleFilter = searchParams.get('isSale');
  const isSale = isSaleFilter === 'true' ? true : isSaleFilter === 'false' ? false : undefined;
  
  const [carRecords, stats] = await Promise.all([
    CarRecordModel.findMany({ search, isSale, limit: 50 }),
    CarRecordModel.getStats()
  ]);

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

      if (isSale && saleDataJson) {
        try {
          carRecordData.saleData = JSON.parse(saleDataJson);
        } catch (e) {
          console.error('Error parsing sale data:', e);
        }
      }

      const result = await CarRecordModel.create(carRecordData);
      
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
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSales, setFilterSales] = useState<boolean | null>(null);

  // Modal states using HeroUI useDisclosure
  const {
    isOpen: isCreationOpen,
    onOpen: onCreationOpen,
    onClose: onCreationClose
  } = useDisclosure();

  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose
  } = useDisclosure();

  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose
  } = useDisclosure();

  const {
    isOpen: isOrganizationOpen,
    onOpen: onOrganizationOpen,
    onClose: onOrganizationClose
  } = useDisclosure();

  // Form and preview data
  const [previewData, setPreviewData] = useState<CarRecordFormData & { expedientNumber: string } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [savedExpedientNumber, setSavedExpedientNumber] = useState<string>('');
  const [savedFormData, setSavedFormData] = useState<CarRecordFormData | null>(null);

  // Show organization modal when record is saved
  useEffect(() => {
    if (actionData?.success && savedExpedientNumber) {
      onOrganizationOpen();
    } else if (actionData?.error) {
      toast.error(
        'Error al guardar',
        actionData.error,
        5000
      );
    }
  }, [actionData, savedExpedientNumber, onOrganizationOpen]);

  const generateExpedientNumber = () => {
    const year = new Date().getFullYear();
    const count = stats.total + 1;
    return `EXP-${year}-${count.toString().padStart(6, '0')}`;
  };

  const handlePreview = (formData: CarRecordFormData) => {
    const expedientNumber = generateExpedientNumber();
    setPreviewData({ ...formData, expedientNumber });
    onCreationClose();
    onPreviewOpen();
  };

  const handleConfirmSave = () => {
    if (!previewData) return;

    // Save expedient number and form data before clearing preview data
    setSavedExpedientNumber(previewData.expedientNumber);
    setSavedFormData(previewData);

    const formData = new FormData();
    formData.append('intent', 'create');
    formData.append('title', previewData.title);
    formData.append('isSale', previewData.isSale.toString());
    formData.append('notes', previewData.notes);
    formData.append('documents', JSON.stringify(previewData.documents));
    
    if (previewData.saleDate) {
      formData.append('saleDate', previewData.saleDate);
    }
    
    if (previewData.isSale) {
      const saleData = {
        vehicle: previewData.vehicleData,
        customer: previewData.customerData,
        seller: previewData.sellerData
      };
      formData.append('saleData', JSON.stringify(saleData));
    }
    
    submit(formData, { method: 'post' });
    
    // Close modals immediately after submission
    onPreviewClose();
    setPreviewData(null);
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (searchTerm) searchParams.set('search', searchTerm);
    if (filterSales !== null) searchParams.set('isSale', filterSales.toString());
    
    submit(searchParams, { method: 'get', replace: true });
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    onViewOpen();
  };

  const handleCloseView = () => {
    onViewClose();
    setSelectedRecord(null);
  };

  const handleOrganizationConfirm = (organizationData: OrganizationData) => {
    if (organizationData.folderInfo) {
      toast.success(
        '¡Expediente organizado automáticamente!',
        `Carpeta creada: ${organizationData.folderInfo.folderNumber}`,
        6000
      );
    } else {
      toast.success(
        '¡Expediente organizado!',
        `El expediente ${savedExpedientNumber} ha sido organizado exitosamente`,
        5000
      );
    }
    onOrganizationClose();
    setSavedExpedientNumber('');
    setSavedFormData(null);
    setPreviewData(null);
  };

  const handleOrganizationSkip = () => {
    toast.info(
      'Organización omitida',
      `El expediente ${savedExpedientNumber} se guardó sin organizar`,
      4000
    );
    onOrganizationClose();
    setSavedExpedientNumber('');
    setSavedFormData(null);
    setPreviewData(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Expedientes de Autos</h1>
          <p className="text-gray-600">
            Gestiona documentos de autos vendidos con el modelo legacy
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            {
              title: 'Total Expedientes',
              value: stats.total,
              description: 'Expedientes registrados',
              icon: Folder,
              color: 'blue',
              bgColor: 'bg-blue-100',
              iconColor: 'text-blue-600'
            },
            {
              title: 'Ventas',
              value: stats.sales,
              description: `${stats.total > 0 ? Math.round((stats.sales / stats.total) * 100) : 0}% del total`,
              icon: Check,
              color: 'green',
              bgColor: 'bg-green-100',
              iconColor: 'text-green-600'
            },
            {
              title: 'Otros Documentos',
              value: stats.other,
              description: `${stats.total > 0 ? Math.round((stats.other / stats.total) * 100) : 0}% del total`,
              icon: FileText,
              color: 'orange',
              bgColor: 'bg-orange-100',
              iconColor: 'text-orange-600'
            },
            {
              title: 'Total Documentos',
              value: stats.totalDocuments,
              description: 'Archivos subidos',
              icon: Upload,
              color: 'purple',
              bgColor: 'bg-purple-100',
              iconColor: 'text-purple-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.4,
                delay: 0.1 + index * 0.1,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-sm ${stat.iconColor} flex items-center mt-1`}>
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {stat.description}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Create Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-start"
        >
          <Button
            color="primary"
            size="lg"
            onPress={onCreationOpen}
            startContent={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            Nuevo Expediente
          </Button>
        </motion.div>

        {/* Search and Filters */}
        <CarRecordSearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterSales={filterSales}
          setFilterSales={setFilterSales}
          onSearch={handleSearch}
          stats={stats}
          resultsCount={carRecords.length}
        />

        {/* Records Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <AnimatePresence>
            {carRecords.map((record: any, index: number) => (
              <CarRecordCard
                key={record._id}
                record={record}
                index={index}
                onView={handleViewRecord}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence>
          {carRecords.length === 0 && (
            <motion.div 
              className="text-center py-16"
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
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              </motion.div>
              <motion.h3 
                className="text-xl font-semibold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                No se encontraron expedientes
              </motion.h3>
              <motion.p 
                className="text-gray-500 mb-6"
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
                    color="primary"
                    size="lg"
                    onPress={onCreationOpen}
                    startContent={<Plus className="w-4 h-4" />}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Crear Expediente
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CarRecordCreationModal
        isOpen={isCreationOpen}
        onClose={onCreationClose}
        onPreview={handlePreview}
        stats={stats}
      />

      {previewData && (
        <CarRecordPreviewModal
          isOpen={isPreviewOpen}
          onClose={onPreviewClose}
          onConfirm={handleConfirmSave}
          data={previewData}
        />
      )}

      <CarRecordViewModal
        isOpen={isViewOpen}
        onClose={handleCloseView}
        record={selectedRecord}
      />

      <CarRecordOrganizationModal
        isOpen={isOrganizationOpen}
        onClose={handleOrganizationSkip}
        onConfirm={handleOrganizationConfirm}
        expedientNumber={savedExpedientNumber}
        saleDate={savedFormData?.saleDate}
        isSale={savedFormData?.isSale}
      />
    </AdminLayout>
  );
}