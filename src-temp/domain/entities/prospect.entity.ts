export interface Budget {
  min: number;
  max: number;
}

export interface ReassignmentEntry {
  fromUserId: string;
  toUserId: string;
  reassignedBy: string; // Super admin who made the change
  reason: string;
  timestamp: Date;
}

export class Prospect {
  constructor(
    public id: string,
    public name: string,
    public phone: string,
    public source: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp' | 'website' | 'referral' | 'other',
    public status: 'new' | 'contacted' | 'appointment_scheduled' | 'qualified' | 'converted' | 'not_interested',
    public createdAt: Date,
    public updatedAt: Date,
    public email?: string,
    public sourceDetails?: string,
    public interestedListingId?: string,
    public interestedListingTitle?: string,
    public manualListingDescription?: string,
    public budget?: Budget,
    public message?: string,
    public appointmentDate?: Date,
    public appointmentNotes?: string,
    public tags: string[] = [],
    public notes?: string,
    public createdBy?: string, // Clerk ID of who originally created
    public currentlyAssignedTo?: string, // Clerk ID of current handler
    public reassignmentHistory: ReassignmentEntry[] = []
  ) {}

  updateStatus(status: Prospect['status']): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  scheduleAppointment(appointmentDate: Date, notes?: string): void {
    this.appointmentDate = appointmentDate;
    this.appointmentNotes = notes;
    this.status = 'appointment_scheduled';
    this.updatedAt = new Date();
  }

  updateContactInfo(updates: {
    name?: string;
    phone?: string;
    email?: string;
  }): void {
    if (updates.name) this.name = updates.name;
    if (updates.phone) this.phone = updates.phone;
    if (updates.email !== undefined) this.email = updates.email;
    this.updatedAt = new Date();
  }

  updateInterest(updates: {
    interestedListingId?: string;
    interestedListingTitle?: string;
    manualListingDescription?: string;
    budget?: Budget;
  }): void {
    if (updates.interestedListingId !== undefined) this.interestedListingId = updates.interestedListingId;
    if (updates.interestedListingTitle !== undefined) this.interestedListingTitle = updates.interestedListingTitle;
    if (updates.manualListingDescription !== undefined) this.manualListingDescription = updates.manualListingDescription;
    if (updates.budget) this.budget = updates.budget;
    this.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  reassign(
    newAssignee: string, 
    reassignedBy: string, 
    reason: string
  ): void {
    const reassignmentEntry: ReassignmentEntry = {
      fromUserId: this.currentlyAssignedTo || this.createdBy || 'unknown',
      toUserId: newAssignee,
      reassignedBy,
      reason,
      timestamp: new Date()
    };

    this.reassignmentHistory.push(reassignmentEntry);
    this.currentlyAssignedTo = newAssignee;
    this.updatedAt = new Date();
  }

  isAssignedTo(userId: string): boolean {
    return this.currentlyAssignedTo === userId || 
           (!this.currentlyAssignedTo && this.createdBy === userId);
  }

  getAssignedUser(): string | undefined {
    return this.currentlyAssignedTo || this.createdBy;
  }

  getDaysOld(): number {
    const diffTime = Math.abs(new Date().getTime() - this.createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  isStale(): boolean {
    // Consider a prospect stale if it's been more than 7 days without status update
    const daysSinceUpdate = Math.ceil((new Date().getTime() - this.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceUpdate > 7 && this.status === 'new';
  }

  isHot(): boolean {
    return this.status === 'appointment_scheduled' || 
           (this.status === 'contacted' && this.getDaysOld() <= 3);
  }

  canBeReassigned(): boolean {
    return this.status !== 'converted' && this.status !== 'not_interested';
  }

  getStatusPriority(): number {
    const priorities = {
      'new': 5,
      'contacted': 4,
      'appointment_scheduled': 1,
      'qualified': 2,
      'converted': 3,
      'not_interested': 6
    };
    return priorities[this.status] || 7;
  }

  getBudgetRange(): string | null {
    if (!this.budget) return null;
    return `$${this.budget.min.toLocaleString()} - $${this.budget.max.toLocaleString()}`;
  }

  toSummary(): {
    id: string;
    name: string;
    phone: string;
    email?: string;
    source: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    daysOld: number;
    isHot: boolean;
    isStale: boolean;
    assignedTo?: string;
    interestedIn?: string;
    budgetRange?: string;
  } {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      source: this.source,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      daysOld: this.getDaysOld(),
      isHot: this.isHot(),
      isStale: this.isStale(),
      assignedTo: this.getAssignedUser(),
      interestedIn: this.interestedListingTitle || this.manualListingDescription,
      budgetRange: this.getBudgetRange()
    };
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('El nombre es requerido');
    }

    if (!this.phone || this.phone.trim().length === 0) {
      errors.push('El teléfono es requerido');
    }

    if (this.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('El email no tiene un formato válido');
    }

    if (this.budget && (this.budget.min < 0 || this.budget.max < this.budget.min)) {
      errors.push('El presupuesto no es válido');
    }

    if (this.status === 'appointment_scheduled' && !this.appointmentDate) {
      errors.push('La fecha de cita es requerida cuando el estado es "cita programada"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}