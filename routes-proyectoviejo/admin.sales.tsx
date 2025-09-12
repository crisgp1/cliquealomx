import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import { ClientModel } from '~/models/Client.server';
import { AdminLayout } from '~/components/admin/AdminLayout';
import { AdminSales } from '~/components/admin/AdminSales';

export async function loader(args: LoaderFunctionArgs) {
  await requireClerkAdmin(args);
  
  const sales = await ClientModel.findMany({
    limit: 100,
    skip: 0
  });
  
  return json({
    sales: sales.map((sale: any) => ({
      _id: sale._id?.toString() || sale.id,
      name: sale.name || '',
      email: sale.email || '',
      phone: sale.phone || '',
      rfc: sale.rfc || '',
      address: sale.address || '',
      idNumber: sale.idNumber || '',
      contractType: sale.contractType || 'compraventa',
      vehicleInfo: {
        brand: sale.vehicleInfo?.brand || '',
        model: sale.vehicleInfo?.model || '',
        year: sale.vehicleInfo?.year || '',
        color: sale.vehicleInfo?.color || '',
        motor: sale.vehicleInfo?.motor || '',
        series: sale.vehicleInfo?.series || '',
        plates: sale.vehicleInfo?.plates || '',
        type: sale.vehicleInfo?.type || '',
        circulation: sale.vehicleInfo?.circulation || '',
        invoice: sale.vehicleInfo?.invoice || '',
        refrendos: sale.vehicleInfo?.refrendos || ''
      },
      contractData: {
        totalAmount: sale.contractData?.totalAmount || '$0',
        paymentMethod: sale.contractData?.paymentMethod || '',
        date: sale.contractData?.date || '',
        time: sale.contractData?.time || '',
        city: sale.contractData?.city || '',
        observations: sale.contractData?.observations || ''
      },
      documents: {
        signedContract: sale.documents?.signedContract || [],
        identification: sale.documents?.identification || [],
        vehicleDocuments: sale.documents?.vehicleDocuments || [],
        other: sale.documents?.other || []
      },
      listingId: sale.listingId?.toString() || '',
      listingStatus: sale.listingStatus || 'active',
      notes: sale.notes || '',
      contractNumber: sale.contractNumber || '',
      createdAt: sale.createdAt || new Date(),
      updatedAt: sale.updatedAt || new Date(),
      isActive: sale.isActive !== false,
      createdBy: sale.createdBy?.toString() || ''
    }))
  });
}

export default function AdminSalesPage() {
  const { sales } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <AdminLayout>
      <AdminSales onBack={handleBack} sales={sales} />
    </AdminLayout>
  );
}