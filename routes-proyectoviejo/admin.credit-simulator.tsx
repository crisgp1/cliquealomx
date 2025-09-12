import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import { BankPartnerModel } from '~/models/BankPartner.server';
import { ListingModel } from '~/models/Listing.server';
import { AdminLayout } from '~/components/admin/AdminLayout';
import { AdminCreditSimulator } from '~/components/admin/AdminCreditSimulator';

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkAdmin(args);
  
  const [bankPartners, listings] = await Promise.all([
    BankPartnerModel.findActiveForSimulator(),
    ListingModel.findMany({ status: 'active' })
  ]);
  
  return json({
    bankPartners,
    listings: listings.map((listing: any) => ({
      id: listing._id?.toString() || listing.id,
      title: listing.title,
      price: listing.price,
      year: listing.year,
      make: listing.brand || listing.make,
      model: listing.model,
      images: listing.images
    }))
  });
}

export default function AdminCreditSimulatorRoute() {
  const data = useLoaderData<typeof loader>();
  const { bankPartners, listings } = data;
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Simulador de Crédito Interno</h1>
            <p className="mt-2 text-sm text-gray-700">
              Simula créditos con vehículos y genera cotizaciones para clientes
            </p>
          </div>
        </div>
        
        <AdminCreditSimulator bankPartners={bankPartners} listings={listings} />
      </div>
    </AdminLayout>
  );
}