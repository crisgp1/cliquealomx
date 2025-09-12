import { type ActionFunctionArgs } from '@remix-run/node';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import { generateContractPDFFromHTML } from '~/utils/pdf-generator';
import { 
  generateConsignmentContractNumber
} from '~/contracts/consignacion';

interface ContractData {
  city: string;
  date: string;
  time: string;
  contractType: 'compraventa' | 'apartado' | 'consignacion';
  buyerName: string;
  buyerRFC: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerIDType: string;
  buyerID: string;
  addressProofNote?: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleMotor: string;
  vehicleSeries: string;
  vehiclePlates: string;
  vehicleType: string;
  vehicleCirculation: string;
  vehicleInvoice: string;
  vehicleRefrendos: string;
  totalAmount: string;
  totalAmountInWords?: string;
  paymentMethod: string;
  observations: string;
  contractNumber?: string;
  pdfType?: 'original' | 'copy';
  
  // Consignment specific fields
  consignmentLevel?: 'bajo' | 'medio' | 'maximo';
  consignmentPrice?: string;
  consignmentDuration?: string;
  commissionPercentage?: string;
  vehicleKilometers?: string;
  bodyCondition?: string;
  bodyDetails?: string;
  mechanicalCondition?: string;
  mechanicalDetails?: string;
  interiorCondition?: string;
  interiorDetails?: string;
  generalObservations?: string;
}

export async function action(args: ActionFunctionArgs) {
  await requireClerkAdmin(args);
  
  const { request } = args;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const contractData: ContractData = await request.json();
    
    // Debug: Log received data
    console.log('PDF API received data:', {
      buyerName: contractData.buyerName,
      buyerAddress: contractData.buyerAddress,
      addressProofNote: contractData.addressProofNote,
      vehicleBrand: contractData.vehicleBrand,
      totalAmount: contractData.totalAmount,
      contractType: contractData.contractType,
      consignmentLevel: contractData.consignmentLevel
    });
    
    // Generate contract number if not provided
    if (!contractData.contractNumber) {
      if (contractData.contractType === 'consignacion' && contractData.consignmentLevel) {
        contractData.contractNumber = generateConsignmentContractNumber(contractData.consignmentLevel);
      } else {
        contractData.contractNumber = generateContractNumber();
      }
    }
    
    console.log('Generating PDF for contract:', contractData.contractNumber);
    
    // Get the PDF type from query parameter
    const url = new URL(request.url);
    const pdfType = url.searchParams.get('type') || 'original';
    
    console.log('PDF type requested:', pdfType);
    
    // Generate the requested PDF version using HTML/CSS
    const pdfBuffer = await generateContractPDFFromHTML({ ...contractData, pdfType: pdfType as 'original' | 'copy' });
    
    console.log('PDF buffer generated, size:', pdfBuffer.length, 'bytes');
    
    const destinatario = pdfType === 'original' ? 'CLIENTE' : 'CLIQUEALO';
    const fileName = `contrato-${contractData.contractType}-${contractData.contractNumber}-${destinatario}-${contractData.buyerName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    
    console.log('Returning PDF response with filename:', fileName);
    
    // Return PDF response
    const response = new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'Access-Control-Expose-Headers': 'Content-Disposition'
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    return new Response(`Error generating contract PDF: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}

// Generate unique contract number
function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `CX-${year}${month}${day}-${random}`;
}