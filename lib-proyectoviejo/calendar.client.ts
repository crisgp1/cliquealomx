import { formatInTimeZone } from 'date-fns-tz';

export interface AppointmentData {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  customerName: string;
  sellerName: string;
  sellerEmail: string;
  customerPhone?: string;
  appointmentType: 'test_drive' | 'consultation' | 'paperwork' | 'delivery' | 'other';
}

/**
 * Generate Google Calendar URL for an appointment
 */
export function generateGoogleCalendarUrl(appointment: AppointmentData): string {
  const appointmentTypeLabels = {
    test_drive: 'Prueba de Manejo',
    consultation: 'Consulta',
    paperwork: 'Documentación',
    delivery: 'Entrega',
    other: 'Otro'
  };

  const title = `${appointmentTypeLabels[appointment.appointmentType]} - ${appointment.customerName}`;
  
  const description = `
Tipo: ${appointmentTypeLabels[appointment.appointmentType]}
Cliente: ${appointment.customerName}
Vendedor: ${appointment.sellerName}
${appointment.customerPhone ? `Teléfono: ${appointment.customerPhone}` : ''}
${appointment.description ? `Notas: ${appointment.description}` : ''}

Generado por Cliquealo.mx
  `.trim();

  const startDate = formatInTimeZone(appointment.start, 'America/Mexico_City', 'yyyyMMdd\'T\'HHmmss');
  const endDate = formatInTimeZone(appointment.end, 'America/Mexico_City', 'yyyyMMdd\'T\'HHmmss');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate}/${endDate}`,
    details: description,
    location: appointment.location || 'Cliquealo.mx - Oficinas',
    ctz: 'America/Mexico_City'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL for an appointment
 */
export function generateOutlookCalendarUrl(appointment: AppointmentData): string {
  const appointmentTypeLabels = {
    test_drive: 'Prueba de Manejo',
    consultation: 'Consulta',
    paperwork: 'Documentación',
    delivery: 'Entrega',
    other: 'Otro'
  };

  const title = `${appointmentTypeLabels[appointment.appointmentType]} - ${appointment.customerName}`;
  
  const description = `
Tipo: ${appointmentTypeLabels[appointment.appointmentType]}
Cliente: ${appointment.customerName}
Vendedor: ${appointment.sellerName}
${appointment.customerPhone ? `Teléfono: ${appointment.customerPhone}` : ''}
${appointment.description ? `Notas: ${appointment.description}` : ''}

Generado por Cliquealo.mx
  `.trim();

  const startDate = appointment.start.toISOString();
  const endDate = appointment.end.toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDate,
    enddt: endDate,
    body: description,
    location: appointment.location || 'Cliquealo.mx - Oficinas'
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Privacy-safe customer info display
 */
export function getPrivateCustomerInfo(customerName: string, customerPhone?: string) {
  // Get initials from name
  const initials = customerName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('.');

  // Get last 4 digits of phone if available
  const phoneDisplay = customerPhone 
    ? `****${customerPhone.slice(-4)}`
    : undefined;

  return {
    initials,
    phoneDisplay
  };
}