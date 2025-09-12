import { json } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"

export async function loader() {
  return json({ message: "Test route working", timestamp: new Date().toISOString() })
}

export default function TestEdit() {
  const { message, timestamp } = useLoaderData<typeof loader>()
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Test Route</h1>
        <p className="text-gray-600 mb-2">{message}</p>
        <p className="text-sm text-gray-400">{timestamp}</p>
        <div className="mt-8">
          <a href="/listings/68524f9546a1fc339e374500/edit" className="text-blue-600 hover:underline">
            Try edit route
          </a>
        </div>
      </div>
    </div>
  )
}