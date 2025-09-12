import { type ActionFunctionArgs } from '@remix-run/node';
import { requireClerkAdmin } from '~/lib/auth-clerk.server';
import puppeteer from 'puppeteer-core';

interface PaymentRow {
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export async function action(args: ActionFunctionArgs) {
  await requireClerkAdmin(args);
  
  const { request } = args;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFDocument(data);
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${data.simulation.bankPartner.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response('Error generating PDF', { status: 500 });
  }
}

function generateAmortizationTable(principal: number, annualRate: number, months: number): PaymentRow[] {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  
  const schedule: PaymentRow[] = [];
  let balance = principal;
  
  for (let i = 1; i <= months; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: balance
    });
  }
  
  return schedule;
}

async function generatePDFDocument(data: any): Promise<Buffer> {
  const { vehicle, simulation, client, term, generatedAt, generatedBy } = data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Generate complete amortization table - show ALL payments
  const amortizationTable = generateAmortizationTable(
    simulation.financedAmount,
    simulation.bankPartner.creditRate,
    term
  );

  // Show ALL payments - no ellipsis or truncation
  const showPayments = amortizationTable;

  const quoteFolio = `CLQ-${Date.now().toString().slice(-6)}`;
  const quoteDate = new Date(generatedAt);
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotización de Crédito Automotriz</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          color: #1f2937;
          line-height: 1.5;
          font-size: 14px;
        }
        
        .page {
          max-width: 210mm;
          margin: 0 auto;
          padding: 8mm;
          background: white;
        }
        
        /* Header Section */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border: 2px solid #374151;
          border-radius: 8px;
          margin-bottom: 12px;
          background: #f8fafc;
        }
        
        .header-left h1 {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 2px;
        }
        
        .header-left .tagline {
          color: #6b7280;
          font-size: 10px;
          margin-bottom: 4px;
        }
        
        .header-left .contact {
          color: #9ca3af;
          font-size: 9px;
        }
        
        .header-right {
          text-align: right;
        }
        
        .header-right .quote-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }
        
        .header-right .quote-number {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }
        
        .header-right .date-info {
          font-size: 11px;
          color: #6b7280;
        }
        
        /* Card Sections */
        .card {
          border: 1px solid #374151;
          border-radius: 6px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        
        .card-header {
          background: #f3f4f6;
          padding: 12px 16px;
          border-bottom: 1px solid #374151;
        }
        
        .card-header h2 {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .card-content {
          padding: 16px;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .info-section h3 {
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .info-section p {
          color: #6b7280;
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        /* Vehicle Section */
        .vehicle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .vehicle-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .vehicle-price {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
        }
        
        .vehicle-details {
          color: #6b7280;
          font-size: 12px;
        }
        
        /* Financial Summary */
        .summary-highlight {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 12px;
        }
        
        .summary-highlight .label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
        }
        
        .summary-highlight .amount {
          font-size: 24px;
          font-weight: 700;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        
        .summary-item h4 {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .summary-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        /* Amortization Table */
        .table-container {
          border: 1px solid #374151;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background: #374151;
          color: white;
        }
        
        th {
          padding: 8px 6px;
          text-align: right;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        th:first-child {
          text-align: left;
        }
        
        tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        
        tbody tr:hover {
          background: #f1f5f9;
        }
        
        td {
          padding: 6px 6px;
          text-align: right;
          font-size: 9px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        td:first-child {
          text-align: left;
          font-weight: 500;
        }
        
        
        /* Requirements */
        .requirements-list {
          list-style: none;
        }
        
        .requirements-list li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 4px;
          font-size: 10px;
          color: #374151;
        }
        
        .requirements-list li::before {
          content: "✓";
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
          margin-top: 1px;
        }
        
        /* Footer */
        .footer {
          margin-top: 16px;
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #374151;
          border-radius: 6px;
          text-align: center;
        }
        
        .footer p {
          font-size: 9px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .footer .contact-info {
          font-size: 10px;
          font-weight: 600;
          color: #3b82f6;
        }
        
        /* Icons */
        .icon {
          width: 12px;
          height: 12px;
          display: inline-block;
        }
        
        .icon-calculator::before { content: "🧮"; }
        .icon-car::before { content: "🚗"; }
        .icon-bank::before { content: "🏦"; }
        .icon-money::before { content: "💰"; }
        .icon-table::before { content: "📊"; }
        .icon-checklist::before { content: "📋"; }
        
        @media print {
          .page {
            margin: 0;
            padding: 8mm;
          }
          
          .card {
            page-break-inside: avoid;
          }
          
          .table-container {
            page-break-inside: auto;
          }
          
          tbody tr {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <h1>Cliquealo.mx</h1>
            <div class="tagline">Tu mejor opción automotriz</div>
            <div class="contact">ventas@cliquealo.mx • +52 1 55 1234 5678</div>
          </div>
          <div class="header-right">
            <div class="quote-label">COTIZACIÓN</div>
            <div class="quote-number">#${quoteFolio}</div>
            <div class="date-info">
              ${quoteDate.toLocaleDateString('es-MX')}<br>
              ${quoteDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>
        
        <!-- Client and Quote Info -->
        <div class="card">
          <div class="card-content">
            <div class="info-grid">
              <div class="info-section">
                <h3>Cliente</h3>
                <p><strong>${client.name || 'No especificado'}</strong></p>
                <p>${client.email || 'No especificado'}</p>
                <p>${client.phone || 'No especificado'}</p>
              </div>
              <div class="info-section">
                <h3>Detalles de Cotización</h3>
                <p>Plazo: <strong>${term} meses</strong></p>
                <p>Generado por: <strong>${generatedBy}</strong></p>
                <p>Válida hasta: <strong>${validUntil.toLocaleDateString('es-MX')}</strong></p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Vehicle Information -->
        <div class="card">
          <div class="card-header">
            <h2><span class="icon icon-car"></span> Vehículo</h2>
          </div>
          <div class="card-content">
            <div class="vehicle-header">
              <div>
                <div class="vehicle-title">${vehicle.title}</div>
                <div class="vehicle-details">${vehicle.year} • ${vehicle.make} • ${vehicle.model}</div>
              </div>
              <div class="vehicle-price">${formatCurrency(vehicle.price)}</div>
            </div>
          </div>
        </div>
        
        <!-- Bank Information -->
        <div class="card">
          <div class="card-header">
            <h2><span class="icon icon-bank"></span> Institución Financiera</h2>
          </div>
          <div class="card-content">
            <h3 style="font-size: 16px; margin-bottom: 8px;">${simulation.bankPartner.name}</h3>
            <p style="color: #6b7280;">Tasa: <strong>${simulation.bankPartner.creditRate}% anual</strong> • Procesamiento: <strong>${simulation.bankPartner.processingTime} días</strong></p>
          </div>
        </div>
        
        <!-- Financial Summary -->
        <div class="card">
          <div class="card-header">
            <h2><span class="icon icon-money"></span> Resumen Financiero</h2>
          </div>
          <div class="card-content">
            <div class="summary-highlight">
              <div class="label">Pago mensual</div>
              <div class="amount">${formatCurrency(simulation.monthlyPayment)}</div>
            </div>
            
            <div class="summary-grid">
              <div class="summary-item">
                <h4>Enganche</h4>
                <div class="value">${formatCurrency(simulation.downPayment)}</div>
              </div>
              <div class="summary-item">
                <h4>Financiado</h4>
                <div class="value">${formatCurrency(simulation.financedAmount)}</div>
              </div>
              <div class="summary-item">
                <h4>Intereses Totales</h4>
                <div class="value">${formatCurrency(simulation.totalInterest)}</div>
              </div>
              <div class="summary-item">
                <h4>Total a Pagar</h4>
                <div class="value">${formatCurrency(simulation.totalPayment)}</div>
              </div>
              ${simulation.commissionAmount && simulation.commissionPercent ? `
              <div class="summary-item">
                <h4>Comisión (${simulation.commissionPercent}%)</h4>
                <div class="value" style="color: #3b82f6;">${formatCurrency(simulation.commissionAmount)}</div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Amortization Table -->
        <div class="card">
          <div class="card-header">
            <h2><span class="icon icon-table"></span> Tabla de Amortización</h2>
          </div>
          <div class="card-content">
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Pago</th>
                    <th>Mensualidad</th>
                    <th>Capital</th>
                    <th>Interés</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  ${showPayments.map((payment, index) => {
                    const paymentNumber = index + 1;
                    
                    return `
                      <tr>
                        <td>${paymentNumber}</td>
                        <td>${formatCurrency(payment.payment)}</td>
                        <td>${formatCurrency(payment.principal)}</td>
                        <td>${formatCurrency(payment.interest)}</td>
                        <td>${formatCurrency(payment.balance)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- Requirements -->
        <div class="card">
          <div class="card-header">
            <h2><span class="icon icon-checklist"></span> Requisitos</h2>
          </div>
          <div class="card-content">
            <ul class="requirements-list">
              ${simulation.bankPartner.requirements.map((req: string) => `<li>${req}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Esta cotización es válida por 30 días y está sujeta a aprobación crediticia.</p>
          <p>Para proceder con el financiamiento, contacta a nuestro equipo de expertos.</p>
          <div class="contact-info">
            WhatsApp: +52 1 55 1234 5678 • Email: ventas@cliquealo.mx
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Launch Puppeteer and generate PDF
  let browser;
  try {
    // Try to find Chrome/Chromium executable
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    ];

    let executablePath = '';
    for (const path of possiblePaths) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      } catch (e) {
        // Continue trying other paths
      }
    }

    browser = await puppeteer.launch({
      executablePath: executablePath || undefined,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        right: '8mm',
        bottom: '8mm',
        left: '8mm'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('Error generating PDF with Puppeteer:', error);
    throw error;
  }
}