import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import { BankPartnerModel } from "~/models/BankPartner.server"
import { ListingModel } from "~/models/Listing.server"
import { CreditSimulator } from "~/components/forms/CreditSimulator"
import { getClerkUser } from "~/lib/auth-clerk.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const listingId = url.searchParams.get("listing")
  const amount = url.searchParams.get("amount")
  
  let listing = null
  let initialAmount = 0
  let bankPartners = []
  
  if (listingId) {
    // Obtener información del listing desde la base de datos
    listing = await ListingModel.findById(listingId)
    if (listing) {
      // Usar el precio del listing como monto inicial
      initialAmount = listing.price
      // Obtener bancos que financian vehículos del año del listing
      bankPartners = await BankPartnerModel.findActiveForVehicleYear(listing.year)
    }
  } else if (amount) {
    // Si no hay listing pero sí un monto, usar ese monto
    initialAmount = parseFloat(amount)
    // Obtener todos los bancos activos
    bankPartners = await BankPartnerModel.findActiveForSimulator()
  } else {
    // Si no hay listing ni monto, obtener todos los bancos
    bankPartners = await BankPartnerModel.findActiveForSimulator()
  }
  
  return json({
    bankPartners,
    listing,
    initialAmount
  })
}

export async function action(args: ActionFunctionArgs) {
  const user = await getClerkUser(args)
  
  if (!user) {
    // Redirigir al home si no está autenticado
    const formData = await args.request.formData()
    const returnData = {
      bankId: formData.get("bankId"),
      amount: formData.get("amount"),
      downPayment: formData.get("downPayment"),
      term: formData.get("term"),
      monthlyPayment: formData.get("monthlyPayment"),
      interestRate: formData.get("interestRate"),
      bankName: formData.get("bankName"),
      listingId: formData.get("listingId")
    }
    
    const urlParams = new URLSearchParams()
    Object.entries(returnData).forEach(([key, value]) => {
      if (value) urlParams.set(key, value as string)
    })
    
    const returnUrl = `/credit/apply?${urlParams.toString()}`
    
    return redirect(`/?returnTo=${encodeURIComponent(returnUrl)}`)
  }
  
  // Si está autenticado, redirigir directamente a la solicitud de crédito
  const formData = await args.request.formData()
  const queryParams = new URLSearchParams()
  
  for (const [key, value] of formData.entries()) {
    if (value) queryParams.set(key, value.toString())
  }
  
  return redirect(`/credit/apply?${queryParams.toString()}`)
}

export default function CreditSimulatorPage() {
  const { bankPartners, listing, initialAmount } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  
  const handleApplyCredit = async (bankId: string, simulation: any) => {
    // Crear formulario para enviar datos de simulación
    const form = document.createElement('form')
    form.method = 'post'
    form.style.display = 'none'
    
    // Agregar campos ocultos con los datos de la simulación
    const fields = {
      bankId,
      amount: simulation.amount.toString(),
      downPayment: simulation.downPayment.toString(),
      term: simulation.term.toString(),
      monthlyPayment: simulation.monthlyPayment.toString(),
      interestRate: simulation.interestRate.toString(),
      bankName: simulation.bankName,
      ...(listing && { listingId: listing._id.toString() })
    }
    
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    })
    
    document.body.appendChild(form)
    form.submit()
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">
            {listing ? `Simulador de Crédito - ${listing.title}` : 'Simulador de Crédito Automotriz'}
          </h1>
          <p className="text-gray-600">
            {listing
              ? `Simula el financiamiento para este ${listing.brand} ${listing.model} ${listing.year}`
              : 'Compara las mejores opciones de financiamiento de nuestros aliados bancarios'
            }
          </p>
        </div>
        
        {bankPartners.length > 0 ? (
          <CreditSimulator
            bankPartners={bankPartners}
            initialAmount={initialAmount}
            listing={listing}
            vehicleYear={listing?.year}
            onApplyCredit={handleApplyCredit}
          />
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Simulador no disponible
              </h3>
              <p className="text-gray-600 mb-6">
                {listing?.year 
                  ? `No hay bancos que financien vehículos del año ${listing.year}. Los bancos aliados solo financian vehículos más recientes.`
                  : 'Actualmente no tenemos aliados bancarios disponibles para simular créditos.'
                }
              </p>
              <button
                onClick={() => navigate('/listings')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Ver Vehículos Disponibles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}