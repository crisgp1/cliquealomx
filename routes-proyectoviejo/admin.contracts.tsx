import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import { ListingModel } from '~/models/Listing.server';
import { AdminLayout } from '~/components/admin/AdminLayout';
import { AdminContracts } from '~/components/admin/AdminContracts';
import { getRadarPublishableKey } from '~/config/radar.config';

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkAdmin(args);
  
  const listings = await ListingModel.findMany({ status: 'active' });
  
  return json({
    listings: listings.map((listing: any) => ({
      id: listing._id?.toString() || listing.id || '',
      title: listing.title || '',
      price: listing.price || 0,
      year: listing.year || 0,
      make: listing.brand || listing.make || '',
      model: listing.model || '',
      images: listing.images || [],
      color: listing.color || '',
      bodyType: listing.bodyType || '',
      mileage: listing.mileage || 0,
      fuelType: listing.fuelType || '',
      transmission: listing.transmission || ''
    })),
    radarPublishableKey: getRadarPublishableKey()
  });
}

export default function AdminContractsPage() {
  const { listings, radarPublishableKey } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <AdminLayout>
      <AdminContracts onBack={handleBack} listings={listings} radarPublishableKey={radarPublishableKey} />
    </AdminLayout>
  );
}