import { type ActionFunctionArgs } from '@remix-run/node';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import JSZip from 'jszip';
import { generateContractZIPFromHTML } from '~/utils/pdf-generator';
import { 
  generateConsignmentContractNumber
} from '~/contracts/consignacion';

interface ContractData {
  city: string;
  date: string;
  time: string;
  contractType: 'compraventa' | 'apartado' | 'consignacion';
  buyerType: 'persona_fisica' | 'persona_moral';
  buyerName: string;
  buyerRFC: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerIDType: string;
  buyerID: string;
  addressProofNote?: string;
  
  // Persona moral specific fields
  companyName?: string;
  legalRepresentativeName?: string;
  legalRepresentativeID?: string;
  legalRepresentativeIDType?: string;
  isApoderadoLegal?: boolean;
  powerOfAttorneyNumber?: string;
  notaryName?: string;
  notaryNumber?: string;
  notaryLocation?: string;
  legalAddress?: string;
  actosDominioDocument?: string;
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
  
  // Apartado-specific fields
  apartadoAmount?: string;
  apartadoAmountInWords?: string;
  totalPrice?: string;
  totalPriceInWords?: string;
  apartadoExpiryDate?: string;
  
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
    
    // Generate contract number if not provided
    if (!contractData.contractNumber) {
      if (contractData.contractType === 'consignacion' && contractData.consignmentLevel) {
        contractData.contractNumber = generateConsignmentContractNumber(contractData.consignmentLevel);
      } else if (contractData.contractType === 'apartado') {
        contractData.contractNumber = generateApartadoContractNumber();
      } else {
        contractData.contractNumber = generateContractNumber();
      }
    }
    
    console.log('Generating PDF ZIP for contract:', contractData.contractNumber);
    
    // Generate both PDF versions with the SAME contract number using HTML/CSS
    const { originalPDF, copyPDF } = await generateContractZIPFromHTML(contractData);
    
    // Create ZIP file
    const zip = new JSZip();
    
    const baseFileName = `contrato-${contractData.contractType}-${contractData.contractNumber}-${contractData.buyerName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Add both PDFs to ZIP
    zip.file(`${baseFileName}-CLIENTE.pdf`, originalPDF);
    zip.file(`${baseFileName}-CLIQUEALO.pdf`, copyPDF);
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    console.log('ZIP generated, size:', zipBuffer.length, 'bytes');
    
    const fileName = `${baseFileName}-completo.zip`;
    
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Error generating contract ZIP:', error);
    return new Response(`Error generating contract ZIP: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
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

// Generate apartado contract number
function generateApartadoContractNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `APT-${year}-${month}-${day}-${random}`;
}