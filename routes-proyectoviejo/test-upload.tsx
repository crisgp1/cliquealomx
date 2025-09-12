// Página de prueba para verificar el upload de imágenes
import { useState } from "react";
import { MediaUpload } from "~/components/ui/media-upload";
import type { MediaItem } from "~/components/ui/media-upload";

export default function TestUpload() {
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const handleMediaChange = (items: MediaItem[]) => {
    console.log("Media changed:", items);
    setUploadedMedia(items);
    if (items.length > 0) {
      setLastResponse(items[items.length - 1]);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test de Upload de Imágenes</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <MediaUpload
          label="Subir imágenes de prueba"
          maxFiles={10}
          onMediaChange={handleMediaChange}
          initialMedia={uploadedMedia}
          uploadMode="inline"
          showProgress={true}
        />
      </div>

      {lastResponse && (
        <div className="bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Última respuesta del servidor:</h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      {uploadedMedia.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">URLs de imágenes subidas:</h2>
          <ul className="space-y-2">
            {uploadedMedia.map((item, index) => (
              <li key={item.id} className="bg-white p-3 rounded shadow">
                <div className="text-sm text-gray-600">Imagen {index + 1}:</div>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all text-sm"
                >
                  {item.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>Abra la consola del navegador (F12) para ver los logs detallados.</p>
      </div>
    </div>
  );
}