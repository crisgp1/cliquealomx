import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, Link, useFetcher } from "@remix-run/react"
import { UserModel } from "~/models/User.server"
import { getClerkUser } from "~/lib/auth-clerk.server"
import { toast } from "~/components/ui/toast"
import {
  Heart,
  Eye,
  ArrowRight,
  Calendar,
  ArrowLeft,
  Car
} from 'lucide-react'
import { useEffect } from 'react'
import { formatPrice } from '~/utils/formatters'

// Tipo para la respuesta del action
type ActionResponse = { success?: boolean; action?: 'liked' | 'unliked'; error?: string; listingId?: string }

export async function loader(args: LoaderFunctionArgs) {
  const user = await getClerkUser(args)
  
  if (!user) {
    throw new Response("Unauthorized", { status: 401 })
  }
  
  // Obtener todos los listings que el usuario ha marcado como favoritos
  // Usar el _id de MongoDB del usuario, no el clerkId
  const likedListings = await UserModel.getLikedListings(user._id!.toString(), 50)
  
  return json({
    userId: user._id!.toString(),
    likedListings,
    totalLikes: likedListings.length
  })
}

// Action para quitar favoritos
export async function action(args: ActionFunctionArgs) {
  const user = await getClerkUser(args)
  
  if (!user) {
    return json({ error: "Debes iniciar sesión" }, { status: 401 })
  }
  
  const formData = await args.request.formData()
  const intent = formData.get("intent") as string
  const listingId = formData.get("listingId") as string

  if (!listingId) {
    return json({ error: "ID del listing requerido" }, { status: 400 })
  }

  try {
    if (intent === "unlike") {
      // Usar el _id de MongoDB del usuario, no el clerkId
      const success = await UserModel.unlikeListing(user._id!.toString(), listingId)
      if (success) {
        return json({ success: true, action: "unliked", listingId })
      } else {
        return json({ error: "No se pudo quitar el like" }, { status: 400 })
      }
    }
    
    return json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("Error en action:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Componente para el botón de quitar favorito
function RemoveFavoriteButton({ listing }: { listing: any }) {
  const fetcher = useFetcher()
  const isLoading = fetcher.state !== "idle"

  // Mostrar feedback del fetcher
  useEffect(() => {
    if (fetcher.data) {
      const data = fetcher.data as ActionResponse | undefined
      
      // Solo mostrar toast si es para este listing
      if (data?.listingId === listing._id) {
        if (data?.error) {
          toast.error(data.error)
        } else if (data?.success && data.action === "unliked") {
          toast.success("Removido de favoritos")
        }
      }
    }
  }, [fetcher.data, listing._id])

  return (
    <fetcher.Form method="post" style={{ display: 'inline' }}>
      <input type="hidden" name="intent" value="unlike" />
      <input type="hidden" name="listingId" value={listing._id} />
      <button
        type="submit"
        disabled={isLoading}
        className={`p-2 rounded-full transition-all duration-200 bg-red-100 text-red-600 hover:bg-red-200 ${
          isLoading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'hover:scale-105'
        }`}
        title="Quitar de favoritos"
      >
        <Heart className="w-5 h-5 fill-current" />
      </button>
    </fetcher.Form>
  )
}

export default function Favorites() {
  const { userId, likedListings, totalLikes } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/"
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Volver al inicio</span>
            </Link>

            <Link to="/" className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-black rounded-full"></div>
              <span className="text-lg font-light tracking-tight text-gray-900">
                Cliquealo
              </span>
            </Link>

            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
            Mis Favoritos
          </h1>
          <p className="text-lg text-gray-600">
            {totalLikes > 0 
              ? `${totalLikes} auto${totalLikes !== 1 ? 's' : ''} guardado${totalLikes !== 1 ? 's' : ''} como favorito${totalLikes !== 1 ? 's' : ''}`
              : 'Aún no tienes autos favoritos'
            }
          </p>
        </div>

        {/* Results */}
        {likedListings.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {likedListings.map((listing) => (
              <article key={listing._id} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3]">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Car className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {listing.year && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {listing.year}
                    </div>
                  )}

                  {/* Botón para quitar de favoritos */}
                  <div className="absolute top-4 right-4">
                    <RemoveFavoriteButton listing={listing} />
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
                        {listing.title}
                      </h3>
                      {listing.brand && listing.model && (
                        <p className="text-sm text-gray-500">
                          {listing.brand} {listing.model}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-light text-gray-900">
                      ${listing.price ? formatPrice(listing.price) : '0'}
                    </span>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {listing.likesCount && listing.likesCount > 0 && (
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{listing.likesCount}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{listing.viewsCount || 0}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center space-x-1 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
                      </div>
                      {listing.owner?.name && (
                        <div>Por {listing.owner.name}</div>
                      )}
                    </div>

                    <Link
                      to={`/listings/${listing._id}`}
                      className="flex items-center space-x-2 text-gray-900 hover:text-gray-600 transition-colors font-medium group"
                    >
                      <span>Ver detalles</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-8 flex items-center justify-center">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-4">
              Aún no tienes favoritos
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explora nuestro catálogo y marca los autos que más te gusten como favoritos
            </p>
            
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              <span>Explorar catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}