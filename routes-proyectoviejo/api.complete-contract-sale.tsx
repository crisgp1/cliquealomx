import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ObjectId } from 'mongodb';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import { ClientModel } from '~/models/Client.server';
import { ListingModel } from '~/models/Listing.server';
import { UserModel } from '~/models/User.server';

export async function action(args: ActionFunctionArgs) {
  const adminUser = await requireClerkAdmin(args);
  const userId = adminUser._id?.toString() || adminUser.clerkId || 'system'; // Preferir _id de MongoDB, fallback a clerkId
  
  if (args.request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    console.log('Admin user:', { id: adminUser._id, clerkId: adminUser.clerkId, email: adminUser.email });
    
    const formData = await args.request.json();
    
    const {
      contractData,
      closureData,
      documents
    } = formData;
    
    console.log('Full request data:', JSON.stringify(formData, null, 2));
    
    console.log('Contract data received:', { 
      buyerName: contractData?.buyerName, 
      buyerEmail: contractData?.buyerEmail,
      buyerPhone: contractData?.buyerPhone,
      contractType: contractData?.contractType,
      contractNumber: closureData?.contractNumber 
    });

    // Validar que el número de contrato esté presente y tenga el formato correcto
    if (!closureData.contractNumber || !closureData.contractNumber.trim()) {
      return json({ error: 'Número de contrato requerido' }, { status: 400 });
    }

    const contractRegex = /^CX-\d{8}-\d{4}$/;
    if (!contractRegex.test(closureData.contractNumber)) {
      return json({ error: 'Formato de número de contrato incorrecto. Debe ser: CX-YYYYMMDD-XXXX' }, { status: 400 });
    }

    // Validate required fields
    console.log('Validating buyer info:', {
      buyerName: contractData?.buyerName,
      buyerEmail: contractData?.buyerEmail,
      buyerPhone: contractData?.buyerPhone,
      hasContractData: !!contractData
    });

    if (!contractData) {
      return json({ error: 'Contract data is missing' }, { status: 400 });
    }

    const missingFields = [];
    if (!contractData.buyerName || !contractData.buyerName.trim()) {
      missingFields.push('buyerName');
    }
    if (!contractData.buyerEmail || !contractData.buyerEmail.trim()) {
      missingFields.push('buyerEmail');
    }
    if (!contractData.buyerPhone || !contractData.buyerPhone.trim()) {
      missingFields.push('buyerPhone');
    }

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return json({ 
        error: `Missing required buyer information: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Create client in the database
    const clientData = {
      name: contractData.buyerName,
      email: contractData.buyerEmail,
      phone: contractData.buyerPhone,
      rfc: contractData.buyerRFC,
      address: contractData.buyerAddress,
      idType: contractData.buyerIDType,
      idNumber: contractData.buyerID,
      contractType: contractData.contractType,
      vehicleInfo: {
        brand: contractData.vehicleBrand,
        model: contractData.vehicleModel,
        year: contractData.vehicleYear,
        color: contractData.vehicleColor,
        motor: contractData.vehicleMotor,
        series: contractData.vehicleSeries,
        plates: contractData.vehiclePlates,
        type: contractData.vehicleType,
        circulation: contractData.vehicleCirculation,
        invoice: contractData.vehicleInvoice,
        refrendos: contractData.vehicleRefrendos
      },
      contractData: {
        totalAmount: contractData.totalAmount,
        paymentMethod: contractData.paymentMethod,
        date: contractData.date,
        time: contractData.time,
        city: contractData.city,
        observations: contractData.observations
      },
      documents: {
        signedContract: documents.signedContract?.map((doc: any) => doc.url) || [],
        identification: documents.identification?.map((doc: any) => doc.url) || [],
        vehicleDocuments: documents.vehicleDocuments?.map((doc: any) => doc.url) || [],
        other: documents.other?.map((doc: any) => doc.url) || []
      },
      listingId: contractData.selectedListing?.id,
      listingStatus: closureData.listingStatus,
      notes: closureData.clientNotes,
      contractNumber: closureData.contractNumber,
      createdBy: adminUser._id ? new ObjectId(adminUser._id) : userId // Usar ObjectId si está disponible, sino string
    };

    // Create client
    const client = await ClientModel.create(clientData);

    // Update listing status if a listing was selected
    if (contractData.selectedListing?.id && closureData.listingStatus !== 'active') {
      await ListingModel.updateStatus(contractData.selectedListing.id, closureData.listingStatus);
    }

    // Create a basic user record in the User system if needed
    // This creates a minimal user record for the client
    try {
      const existingUser = await UserModel.findByEmail(contractData.buyerEmail);
      if (!existingUser) {
        await UserModel.create({
          name: contractData.buyerName,
          email: contractData.buyerEmail,
          phone: contractData.buyerPhone,
          password: 'temporary-password-' + Date.now(), // They would need to reset this
          role: 'user'
        });
      }
    } catch (error) {
      console.error('Error creating user record:', error);
      // Don't fail the entire operation if user creation fails
    }

    return json({ 
      success: true, 
      client,
      message: 'Contract completed successfully. Client has been registered in both systems.' 
    });

  } catch (error) {
    console.error('Error completing contract sale:', error);
    return json({ 
      error: 'Internal server error', 
      message: 'Failed to complete contract sale' 
    }, { status: 500 });
  }
}