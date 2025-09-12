import { ListingDetailPage } from '@/presentation/components/listings/ListingDetailPage';

interface ListingPageProps {
  params: {
    id: string;
  };
}

export default function ListingPage({ params }: ListingPageProps) {
  return <ListingDetailPage listingId={params.id} />;
}

export async function generateMetadata({ params }: ListingPageProps) {
  // En producción, aquí harías una llamada para obtener el título del listing
  return {
    title: `Anuncio de Auto - Cliquéalo.mx`,
    description: 'Ve los detalles de este anuncio de auto usado',
  };
}