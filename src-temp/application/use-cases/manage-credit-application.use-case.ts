import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreditApplication, ReviewInfo } from '@domain/entities/credit-application.entity';
import { CreditApplicationRepository } from '@domain/repositories/credit-application.repository';

@Injectable()
export class ManageCreditApplicationUseCase {
  constructor(
    private readonly creditApplicationRepository: CreditApplicationRepository
  ) {}

  async submit(applicationId: string, userId: string): Promise<boolean> {
    const application = await this.creditApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundException('Aplicación de crédito no encontrada');
    }

    if (!application.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar esta aplicación');
    }

    if (!application.canBeModified()) {
      throw new ForbiddenException('Esta aplicación ya no puede ser modificada');
    }

    application.submit();
    return await this.creditApplicationRepository.update(applicationId, application);
  }

  async approve(
    applicationId: string, 
    reviewInfo: Omit<ReviewInfo, 'reviewedAt'>,
    adminUserId: string
  ): Promise<boolean> {
    const application = await this.creditApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundException('Aplicación de crédito no encontrada');
    }

    if (!application.canBeReviewed()) {
      throw new ForbiddenException('Esta aplicación no puede ser revisada en su estado actual');
    }

    application.approve({
      ...reviewInfo,
      reviewedBy: adminUserId
    });

    return await this.creditApplicationRepository.update(applicationId, application);
  }

  async reject(
    applicationId: string, 
    reviewInfo: Omit<ReviewInfo, 'reviewedAt'>,
    adminUserId: string
  ): Promise<boolean> {
    const application = await this.creditApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundException('Aplicación de crédito no encontrada');
    }

    if (!application.canBeReviewed()) {
      throw new ForbiddenException('Esta aplicación no puede ser revisada en su estado actual');
    }

    application.reject({
      ...reviewInfo,
      reviewedBy: adminUserId
    });

    return await this.creditApplicationRepository.update(applicationId, application);
  }

  async cancel(applicationId: string, userId: string): Promise<boolean> {
    const application = await this.creditApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundException('Aplicación de crédito no encontrada');
    }

    if (!application.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para cancelar esta aplicación');
    }

    application.cancel();
    return await this.creditApplicationRepository.update(applicationId, application);
  }

  async addDocument(
    applicationId: string, 
    document: { url: string; type: string; name: string; size: number },
    userId: string
  ): Promise<boolean> {
    const application = await this.creditApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundException('Aplicación de crédito no encontrada');
    }

    if (!application.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar esta aplicación');
    }

    if (!application.canBeModified()) {
      throw new ForbiddenException('Esta aplicación ya no puede ser modificada');
    }

    application.addDocument({
      url: document.url,
      type: document.type as any,
      name: document.name,
      size: document.size
    });

    return await this.creditApplicationRepository.update(applicationId, application);
  }

  async removeDocument(
    applicationId: string, 
    documentId: string, 
    userId: string
  ): Promise<boolean> {
    const application = await this.creditApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundException('Aplicación de crédito no encontrada');
    }

    if (!application.isOwnedBy(userId)) {
      throw new ForbiddenException('No tienes permisos para modificar esta aplicación');
    }

    if (!application.canBeModified()) {
      throw new ForbiddenException('Esta aplicación ya no puede ser modificada');
    }

    const removed = application.removeDocument(documentId);
    if (!removed) {
      throw new NotFoundException('Documento no encontrado');
    }

    return await this.creditApplicationRepository.update(applicationId, application);
  }
}