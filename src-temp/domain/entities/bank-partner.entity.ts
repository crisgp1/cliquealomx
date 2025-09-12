export interface BankPartnerIncident {
  id: string;
  type: 'tardanza' | 'no_respuesta' | 'mala_atencion' | 'documentos_faltantes' | 'proceso_lento' | 'otro';
  description: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  reportedBy: string; // Clerk ID del admin
  reportedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string; // Clerk ID
  notes?: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface IncidentStats {
  total: number;
  unresolved: number;
  lastIncident?: Date;
}

export class BankPartner {
  constructor(
    public id: string,
    public name: string,
    public creditRate: number, // Tasa de interés anual
    public minTerm: number, // Plazo mínimo en meses
    public maxTerm: number, // Plazo máximo en meses
    public requirements: string[], // Requisitos específicos del banco
    public processingTime: number, // Tiempo de procesamiento en días
    public isActive: boolean,
    public createdBy: string, // Clerk ID del admin
    public createdAt: Date,
    public updatedAt: Date,
    public logo?: string,
    public minVehicleYear?: number, // Año mínimo del vehículo
    public contactInfo?: ContactInfo,
    public incidents: BankPartnerIncident[] = [],
    public incidentStats?: IncidentStats
  ) {}

  updateCreditRate(newRate: number): void {
    this.creditRate = newRate;
    this.updatedAt = new Date();
  }

  updateMinVehicleYear(minYear: number | null): void {
    this.minVehicleYear = minYear || undefined;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  toggleActive(): void {
    this.isActive = !this.isActive;
    this.updatedAt = new Date();
  }

  reportIncident(incident: Omit<BankPartnerIncident, 'id' | 'reportedAt' | 'resolved'>): BankPartnerIncident {
    const newIncident: BankPartnerIncident = {
      ...incident,
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportedAt: new Date(),
      resolved: false
    };

    this.incidents.push(newIncident);
    this.updateIncidentStats();
    this.updatedAt = new Date();

    return newIncident;
  }

  resolveIncident(incidentId: string, resolvedBy: string, notes?: string): boolean {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident || incident.resolved) return false;

    incident.resolved = true;
    incident.resolvedAt = new Date();
    incident.resolvedBy = resolvedBy;
    if (notes) incident.notes = notes;

    this.updateIncidentStats();
    this.updatedAt = new Date();

    return true;
  }

  private updateIncidentStats(): void {
    const unresolved = this.incidents.filter(i => !i.resolved);
    const lastIncident = this.incidents.length > 0 
      ? this.incidents.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime())[0]
      : undefined;

    this.incidentStats = {
      total: this.incidents.length,
      unresolved: unresolved.length,
      lastIncident: lastIncident?.reportedAt
    };
  }

  getIncidentsByFilter(filters: {
    resolved?: boolean;
    type?: BankPartnerIncident['type'];
    severity?: BankPartnerIncident['severity'];
    limit?: number;
  } = {}): BankPartnerIncident[] {
    let filtered = [...this.incidents];

    if (typeof filters.resolved === 'boolean') {
      filtered = filtered.filter(i => i.resolved === filters.resolved);
    }
    if (filters.type) {
      filtered = filtered.filter(i => i.type === filters.type);
    }
    if (filters.severity) {
      filtered = filtered.filter(i => i.severity === filters.severity);
    }

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());

    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  canFinanceVehicle(vehicleYear: number): boolean {
    return !this.minVehicleYear || vehicleYear >= this.minVehicleYear;
  }

  canProcessTerm(term: number): boolean {
    return term >= this.minTerm && term <= this.maxTerm;
  }

  isEligibleForAmount(amount: number, term: number, vehicleYear?: number): boolean {
    if (!this.isActive) return false;
    if (!this.canProcessTerm(term)) return false;
    if (vehicleYear && !this.canFinanceVehicle(vehicleYear)) return false;
    
    return true;
  }

  calculateMonthlyPayment(amount: number, term: number): number {
    const monthlyRate = this.creditRate / 100 / 12;
    const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(payment * 100) / 100;
  }
}