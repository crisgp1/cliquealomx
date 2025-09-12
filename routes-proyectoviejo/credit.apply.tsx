import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useSearchParams } from "@remix-run/react"
import { CreditApplicationModel } from "~/models/CreditApplication.server"
import { getClerkUser, requireClerkUser } from "~/lib/auth-clerk.server"
import { ListingModel } from "~/models/Listing.server"
import { CreditApplicationForm } from "~/components/forms/CreditApplicationForm"
import { getRadarPublishableKey } from "~/config/radar.config"

export async function loader(args: LoaderFunctionArgs) {
  const user = await requireClerkUser(args)

  const url = new URL(args.request.url)
  const listingId = url.searchParams.get("listing")
  
  // Obtener datos del simulador si vienen en la URL
  const simulatorData = {
    bankId: url.searchParams.get("bankId"),
    amount: url.searchParams.get("amount"),
    downPayment: url.searchParams.get("downPayment"),
    term: url.searchParams.get("term"),
    monthlyPayment: url.searchParams.get("monthlyPayment"),
    interestRate: url.searchParams.get("interestRate"),
    bankName: url.searchParams.get("bankName")
  }
  
  let listing = null
  if (listingId) {
    listing = await ListingModel.findById(listingId)
  }

  return json({
    userId: user.clerkId,
    listing,
    simulatorData,
    radarPublishableKey: getRadarPublishableKey()
  })
}

export async function action(args: ActionFunctionArgs) {
  const user = await getClerkUser(args)
  if (!user) {
    throw redirect("/")
  }
  
  const userId = user.clerkId
  
  try {
    const applicationData = await args.request.json()
    
    // Función para validar teléfono (10 dígitos)
    const validatePhone = (phone: string): boolean => {
      const cleanPhone = phone.replace(/\D/g, '');
      return cleanPhone.length === 10;
    };
    
    // Validar datos requeridos
    if (!applicationData.personalInfo?.fullName ||
        !applicationData.personalInfo?.email ||
        !applicationData.personalInfo?.phone ||
        !applicationData.employmentInfo?.monthlyIncome ||
        !applicationData.financialInfo?.requestedAmount) {
      return json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Validar teléfono personal (10 dígitos)
    if (!validatePhone(applicationData.personalInfo.phone)) {
      return json({ error: "El teléfono personal debe tener exactamente 10 dígitos" }, { status: 400 })
    }

    // Validar teléfono de trabajo si está presente (10 dígitos)
    if (applicationData.employmentInfo.workPhone && !validatePhone(applicationData.employmentInfo.workPhone)) {
      return json({ error: "El teléfono de trabajo debe tener exactamente 10 dígitos" }, { status: 400 })
    }

    // Validar teléfono de contacto de emergencia (10 dígitos)
    if (!validatePhone(applicationData.emergencyContact.phone)) {
      return json({ error: "El teléfono de contacto de emergencia debe tener exactamente 10 dígitos" }, { status: 400 })
    }

    // Validar CURP (18 caracteres)
    if (applicationData.personalInfo.curp?.length !== 18) {
      return json({ error: "CURP debe tener 18 caracteres" }, { status: 400 })
    }

    // Validar que el monto solicitado sea positivo
    if (applicationData.financialInfo.requestedAmount <= 0) {
      return json({ error: "El monto solicitado debe ser mayor a 0" }, { status: 400 })
    }

    // Validar que el enganche no sea mayor al monto solicitado
    if (applicationData.financialInfo.downPayment >= applicationData.financialInfo.requestedAmount) {
      return json({ error: "El enganche no puede ser mayor o igual al monto solicitado" }, { status: 400 })
    }

    // Verificar si ya existe una solicitud pendiente para este usuario y listing
    if (applicationData.listingId) {
      const existingApplications = await CreditApplicationModel.findByClerkId(userId!, 1, 0)
      const pendingApplication = existingApplications.find(app => 
        app.listingId?.toString() === applicationData.listingId && 
        ['pending', 'under_review'].includes(app.status)
      )
      
      if (pendingApplication) {
        return json({ 
          error: "Ya tienes una solicitud pendiente para este vehículo" 
        }, { status: 400 })
      }
    }

    // Crear la solicitud
    const application = await CreditApplicationModel.createWithClerkId({
      clerkId: userId!,
      listingId: applicationData.listingId || undefined,
      personalInfo: {
        ...applicationData.personalInfo,
        dateOfBirth: new Date(applicationData.personalInfo.dateOfBirth)
      },
      employmentInfo: applicationData.employmentInfo,
      financialInfo: applicationData.financialInfo,
      emergencyContact: applicationData.emergencyContact,
      documents: applicationData.documents || []
    })

    return json({ 
      success: true, 
      applicationId: application._id?.toString(),
      message: "Solicitud de crédito enviada exitosamente" 
    })

  } catch (error) {
    console.error("Error creating credit application:", error)
    return json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}

export default function CreditApply() {
  const { userId, listing, simulatorData, radarPublishableKey } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  
  const handleSuccess = () => {
    // Redirigir a la página de mis solicitudes
    window.location.href = "/credit/my-applications"
  }

  // Preparar datos iniciales del formulario si vienen del simulador
  const initialFormData = simulatorData.bankName ? {
    requestedAmount: simulatorData.amount || "",
    downPayment: simulatorData.downPayment || "",
    preferredTerm: simulatorData.term || "48",
    bankName: simulatorData.bankName || "",
    accountType: "checking" // valor por defecto
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {simulatorData.bankName && (
        <div className="max-w-4xl mx-auto px-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Datos del Simulador Aplicados
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Banco: <strong>{simulatorData.bankName}</strong></p>
                  <p>Monto: <strong>${parseFloat(simulatorData.amount || "0").toLocaleString()}</strong></p>
                  <p>Pago mensual estimado: <strong>${parseFloat(simulatorData.monthlyPayment || "0").toLocaleString()}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CreditApplicationForm
        listingId={listing?._id?.toString()}
        listingTitle={listing ? `${listing.brand} ${listing.model} ${listing.year}` : undefined}
        listingPrice={listing?.price}
        onSuccess={handleSuccess}
        initialFormData={initialFormData}
        radarPublishableKey={radarPublishableKey}
      />
    </div>
  )
}