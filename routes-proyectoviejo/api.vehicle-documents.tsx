import { json, redirect, type ActionFunctionArgs } from "@remix-run/node"
import { requireClerkAdmin } from "~/lib/auth-clerk.server"
import { ListingModel } from "~/models/Listing.server"

export async function action(args: ActionFunctionArgs) {
  const { request } = args
  // Ensure user is admin
  const user = await requireClerkAdmin(args)
  
  const formData = await request.formData()
  const intent = formData.get("intent") as string
  const listingId = formData.get("listingId") as string
  
  if (!listingId) {
    return json({ error: "ID del listing es requerido" }, { status: 400 })
  }

  try {
    switch (intent) {
      case "add-document": {
        const name = formData.get("name") as string
        const type = formData.get("type") as string
        const url = formData.get("url") as string
        const notes = formData.get("notes") as string

        if (!name || !type || !url) {
          return json({ error: "Nombre, tipo y URL son requeridos" }, { status: 400 })
        }

        const document = await ListingModel.addVehicleDocument(listingId, {
          name,
          type: type as any,
          url,
          notes: notes || undefined
        })

        if (!document) {
          return json({ error: "Error al agregar el documento" }, { status: 500 })
        }

        return json({ success: true, document })
      }

      case "remove-document": {
        const documentId = formData.get("documentId") as string
        
        if (!documentId) {
          return json({ error: "ID del documento es requerido" }, { status: 400 })
        }

        const success = await ListingModel.removeVehicleDocument(listingId, documentId)
        
        if (!success) {
          return json({ error: "Error al eliminar el documento" }, { status: 500 })
        }

        return json({ success: true })
      }

      case "get-documents": {
        const documents = await ListingModel.getVehicleDocuments(listingId)
        return json({ success: true, documents })
      }

      default:
        return json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error en vehicle-documents API:", error)
    return json({ error: "Error interno del servidor" }, { status: 500 })
  }
}