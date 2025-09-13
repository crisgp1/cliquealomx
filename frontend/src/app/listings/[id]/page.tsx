import { ListingDetailPage } from '@/presentation/components/listings/ListingDetailPage';

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  return <ListingDetailPage listingId={id} />;
}

export async function generateMetadata({ params }: ListingPageProps) {
  const { id } = await params;
  // En producción, aquí harías una llamada para obtener el título del listing
  return {
    title: `Anuncio ${id} - Cliquéalo.mx`,
    description: `Ve los detalles del anuncio ${id} de auto usado`,
  };
}