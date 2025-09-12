import ical from 'ical-generator';
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
 * Generate iCal (.ics) file content for an appointment
 */
export function generateICalFile(appointment: AppointmentData): string {
  const calendar = ical({
    domain: 'cliquealo.mx',
    name: 'Citas Cliquealo',
    timezone: 'America/Mexico_City'
  });

  const appointmentTypeLabels = {
    test_drive: 'Prueba de Manejo',
    consultation: 'Consulta',
    paperwork: 'Documentación',
    delivery: 'Entrega',
    other: 'Otro'
  };

  calendar.createEvent({
    start: appointment.start,
    end: appointment.end,
    summary: `${appointmentTypeLabels[appointment.appointmentType]} - ${appointment.customerName}`,
    description: `
Tipo: ${appointmentTypeLabels[appointment.appointmentType]}
Cliente: ${appointment.customerName}
Vendedor: ${appointment.sellerName}
${appointment.customerPhone ? `Teléfono: ${appointment.customerPhone}` : ''}
${appointment.description ? `Notas: ${appointment.description}` : ''}

Generado por Cliquealo.mx
    `.trim(),
    location: appointment.location || 'Cliquealo.mx - Oficinas',
    url: `https://cliquealo.mx/admin/citas/${appointment.id}`,
    organizer: {
      name: appointment.sellerName,
      email: appointment.sellerEmail
    },
    attendees: [
      {
        name: appointment.sellerName,
        email: appointment.sellerEmail,
        role: 'req-participant',
        status: 'accepted'
      }
    ],
    status: 'confirmed',
    sequence: 0,
    uid: `appointment-${appointment.id}@cliquealo.mx`
  });

  return calendar.toString();
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

/**
 * Generate appointment duration suggestions
 */
export function getAppointmentDurations(type: AppointmentData['appointmentType']) {
  const durations = {
    test_drive: [
      { label: '30 minutos', minutes: 30 },
      { label: '45 minutos', minutes: 45 },
      { label: '1 hora', minutes: 60 }
    ],
    consultation: [
      { label: '30 minutos', minutes: 30 },
      { label: '45 minutos', minutes: 45 },
      { label: '1 hora', minutes: 60 },
      { label: '1.5 horas', minutes: 90 }
    ],
    paperwork: [
      { label: '45 minutos', minutes: 45 },
      { label: '1 hora', minutes: 60 },
      { label: '1.5 horas', minutes: 90 },
      { label: '2 horas', minutes: 120 }
    ],
    delivery: [
      { label: '1 hora', minutes: 60 },
      { label: '1.5 horas', minutes: 90 },
      { label: '2 horas', minutes: 120 }
    ],
    other: [
      { label: '30 minutos', minutes: 30 },
      { label: '1 hora', minutes: 60 },
      { label: '1.5 horas', minutes: 90 },
      { label: '2 horas', minutes: 120 }
    ]
  };

  return durations[type] || durations.other;
}