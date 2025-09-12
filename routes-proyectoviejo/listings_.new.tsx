import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, Link, useNavigation, useLoaderData, useSubmit } from "@remix-run/react";
import { ListingModel } from "~/models/Listing.server";
import { requireClerkAdmin } from "~/lib/auth-clerk.server";
import { MinimalCarListingForm } from "~/components/forms/MinimalCarListingForm";
import { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Breadcrumbs,
  BreadcrumbItem
} from "@heroui/react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Home,
  Car,
  Eye
} from "lucide-react";
import { AnimationProvider } from "~/components/AnimationProvider";
import { toast } from "~/components/ui/toast";

//  Configuración de textos en español para la página
const PAGE_TEXTS = {
  header: {
    backToListings: "Volver a Listados",
    title: "Crear Nuevo Listado de Vehículo",
    subtitle: "Completa la información para publicar tu vehículo en el marketplace"
  },
  messages: {
    success: "¡Vehículo agregado exitosamente! Puedes agregar otro o ver el listado creado.",
    error: "Error al crear el listado"
  },
  dialog: {
    title: "¡Listado Creado Exitosamente!",
    description: "Tu listado de vehículo ha sido creado y publicado exitosamente.",
    viewListing: "Ver Listado",
    createAnother: "Crear Otro Listado"
  },
  breadcrumbs: {
    home: "Inicio",
    admin: "Administración",
    listings: "Listados",
    new: "Nuevo"
  }
} as const;

export async function loader(args: LoaderFunctionArgs) {
  try {
    const user = await requireClerkAdmin(args);
    return json({ user });
  } catch (error) {
    console.error('Error in listings.new loader:', error);
    throw error;
  }
}

export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const user = await requireClerkAdmin(args);
  const formData = await request.formData();
  
  // Extract form data
  const make = formData.get("make") as string;
  const customMake = formData.get("customMake") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const price = parseFloat(formData.get("price") as string);
  const mileage = parseFloat(formData.get("mileage") as string);
  const fuelTypeValue = formData.get("fuelType") as string;
  const transmissionValue = formData.get("transmission") as string;
  const locationValue = formData.get("location") as string;
  const description = formData.get("description") as string;
  const contactPhone = formData.get("contactPhone") as string;
  const contactWhatsapp = formData.get("contactWhatsapp") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const images = formData.get("images") as string;
  const videos = formData.get("videos") as string;
  const mediaData = formData.get("mediaData") as string;
  const serialNumber = formData.get("serialNumber") as string;
  const motorNumber = formData.get("motorNumber") as string;
  const repuveDocument = formData.get("repuveDocument") as string;
  
  // Convert to expected types for the model
  const fuelType = fuelTypeValue as "gasolina" | "diesel" | "hibrido" | "electrico" | undefined;
  const transmission = transmissionValue as "manual" | "automatico" | undefined;
  const location = locationValue ? {
    city: locationValue.split(',')[0]?.trim() || "",
    state: locationValue.split(',')[1]?.trim() || ""
  } : undefined;
  
  const contactInfo = {
    phone: contactPhone,
    whatsapp: contactWhatsapp,
    email: contactEmail
  };
  
  // Determinar la marca final a usar
  const finalMake = make === "other" ? customMake : make;
  const title = `${year} ${finalMake} ${model}`;
  
  // Validaciones
  if (!make || !model || !year || !price) {
    return json({ error: "Marca, modelo, año y precio son requeridos" }, { status: 400 });
  }
  
  // Validar marca personalizada si se seleccionó "Otra"
  if (make === "other" && !customMake) {
    return json({ error: "Debes especificar la marca del vehículo" }, { status: 400 });
  }
  
  if (year < 1900 || year > new Date().getFullYear() + 1) {
    return json({ error: "Año inválido" }, { status: 400 });
  }
  
  if (price < 0) {
    return json({ error: "El precio debe ser mayor a 0" }, { status: 400 });
  }
  
  try {
    const imageUrls = images
      ? images.split(',').map(url => url.trim()).filter(Boolean)
      : [];
    
    const videoUrls = videos
      ? videos.split(',').map(url => url.trim()).filter(Boolean)
      : [];
    
    // Procesar mediaData si está disponible
    let mediaFiles = undefined;
    if (mediaData) {
      try {
        const parsedMediaData = JSON.parse(mediaData);
        if (Array.isArray(parsedMediaData)) {
          mediaFiles = parsedMediaData.map(item => ({
            id: item.id || `${item.type}-${Date.now()}-${Math.random()}`,
            url: item.url,
            type: item.type,
            name: item.name,
            size: item.size,
            uploadedAt: item.uploadedAt ? new Date(item.uploadedAt) : new Date()
          }));
        }
      } catch (error) {
        console.error('Error parsing mediaData:', error);
      }
    }
    
    const createData: any = {
      title,
      description: description?.trim() || "",
      brand: finalMake.trim(),
      model: model.trim(),
      year,
      price,
      mileage,
      fuelType,
      transmission,
      location,
      contactInfo,
      images: imageUrls,
      videos: videoUrls,
      serialNumber: serialNumber?.trim() || undefined,
      motorNumber: motorNumber?.trim() || undefined,
      user: user._id!
    };
    
    // Solo agregar media si se procesó correctamente
    if (mediaFiles) {
      createData.media = mediaFiles;
    }
    
    // Handle REPUVE document if provided
    if (repuveDocument?.trim()) {
      const vehicleDocuments = createData.vehicleDocuments || [];
      vehicleDocuments.push({
        id: `repuve_${Date.now()}`,
        name: repuveDocument.trim(),
        type: 'repuve',
        url: repuveDocument.trim(), // TODO: This should be the actual uploaded file URL
        uploadedAt: new Date(),
        notes: 'Documento REPUVE generado automáticamente'
      });
      createData.vehicleDocuments = vehicleDocuments;
    }
    
    const listing = await ListingModel.create(createData);
    
    return json({
      success: true,
      message: PAGE_TEXTS.messages.success,
      listingId: listing._id
    });
  } catch (error) {
    console.error(error);
    return json({ error: PAGE_TEXTS.messages.error }, { status: 500 });
  }
}

export default function NewListing() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">("idle");
  
  const isSubmitting = navigation.state === "submitting";
  
  //  Función para manejar envío del formulario
  const handleSubmit = (data: any) => {
    const formData = new FormData();
    
    // Agregar todos los campos del formulario
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "media" && Array.isArray(value)) {
          // Separar imágenes y videos del array de media, preservando IDs
          const images = value.filter(item => item.type === 'image').map(item => item.url);
          const videos = value.filter(item => item.type === 'video').map(item => item.url);
          
          // Enviar la información completa de media para preservar IDs y metadatos
          formData.append("mediaData", JSON.stringify(value));
          formData.append("images", images.join(','));
          formData.append("videos", videos.join(','));
        } else if (key !== "media" && key !== "images" && key !== "videos" && key !== "mediaData") {
          // Excluir campos que ya se procesan arriba
          formData.append(key, String(value));
        }
      }
    });
    
    // Enviar el formulario
    submit(formData, { method: "post" });
  };
  
  useEffect(() => {
    if (actionData) {
      if ('success' in actionData && actionData.success) {
        setFormStatus("success");
        onOpen();
        toast.success("¡Listado de vehículo creado exitosamente!");
      } else if ('error' in actionData) {
        setFormStatus("error");
        toast.error(actionData.error || PAGE_TEXTS.messages.error);
      }
    }
  }, [actionData, onOpen]);

  useEffect(() => {
    if (isSubmitting) {
      setFormStatus("idle");
    }
  }, [isSubmitting]);
  
  return (
    <AnimationProvider>
      <div className="min-h-screen bg-white">
        {/* Header minimalista */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-b border-gray-100 sticky top-0 z-40"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Breadcrumbs responsive */}
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 overflow-x-auto">
                <Link href="/" className="hover:text-gray-700 transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">{PAGE_TEXTS.breadcrumbs.home}</span>
                  <Home className="w-3.5 h-3.5 sm:hidden" />
                </Link>
                <span className="text-gray-400">/</span>
                <Link href="/admin" className="hover:text-gray-700 transition-colors whitespace-nowrap">
                  <span className="hidden sm:inline">{PAGE_TEXTS.breadcrumbs.admin}</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
                <span className="text-gray-400">/</span>
                <Link href="/admin/listings" className="hover:text-gray-700 transition-colors whitespace-nowrap">
                  <span className="hidden md:inline">{PAGE_TEXTS.breadcrumbs.listings}</span>
                  <span className="md:hidden">...</span>
                </Link>
                <span className="text-gray-400 hidden md:inline">/</span>
                <span className="text-gray-700 whitespace-nowrap hidden md:inline">{PAGE_TEXTS.breadcrumbs.new}</span>
                <span className="text-gray-700 whitespace-nowrap md:hidden">Nuevo</span>
              </div>

              {/* User info minimalista */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">{user.name}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Título minimalista */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-gray-800 mb-2">
              {PAGE_TEXTS.header.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              {PAGE_TEXTS.header.subtitle}
            </p>
          </motion.div>

          {/* Mensajes de estado minimalistas */}
          {actionData && 'error' in actionData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{actionData.error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulario Minimalista */}
          <MinimalCarListingForm
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            defaultValues={{}}
          />

          {/* Modal de éxito minimalista */}
          <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            size="sm"
            classNames={{
              backdrop: "bg-black/30",
              base: "bg-white",
              body: "py-4 px-5",
              header: "border-b border-gray-100 py-3 px-5",
              footer: "border-t border-gray-100 py-3 px-5"
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-600" />
                  <h3 className="text-base font-medium text-gray-800">
                    {PAGE_TEXTS.dialog.title}
                  </h3>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-600">
                  {PAGE_TEXTS.dialog.description}
                </p>
              </ModalBody>
              <ModalFooter className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {PAGE_TEXTS.dialog.createAnother}
                </button>
                {actionData && 'listingId' in actionData && (
                  <Link
                    to={`/listings/${actionData.listingId}`}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {PAGE_TEXTS.dialog.viewListing}
                  </Link>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        </main>
      </div>
    </AnimationProvider>
  );
}