import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { 
  CreateCreditApplicationUseCase, 
  CreateCreditApplicationDto 
} from '@application/use-cases/create-credit-application.use-case';
import { GetCreditApplicationsUseCase } from '@application/use-cases/get-credit-applications.use-case';
import { ManageCreditApplicationUseCase } from '@application/use-cases/manage-credit-application.use-case';
import { CreditApplicationFilters } from '@domain/repositories/credit-application.repository';
import { ClerkAuthGuard } from '@presentation/guards/clerk-auth.guard';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';

@Controller('api/credit/applications')
export class CreditApplicationController {
  constructor(
    private readonly createCreditApplicationUseCase: CreateCreditApplicationUseCase,
    private readonly getCreditApplicationsUseCase: GetCreditApplicationsUseCase,
    private readonly manageCreditApplicationUseCase: ManageCreditApplicationUseCase,
  ) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(
    @Body() createCreditApplicationDto: CreateCreditApplicationDto,
    @CurrentUser() user: any
  ) {
    try {
      const application = await this.createCreditApplicationUseCase.execute({
        ...createCreditApplicationDto,
        userId: user.id
      });

      return {
        success: true,
        data: application,
        message: 'Aplicación de crédito creada exitosamente'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al crear la aplicación de crédito',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @UseGuards(ClerkAuthGuard) // Requiere autenticación para ver aplicaciones
  async findAll(@Query() filters: CreditApplicationFilters) {
    try {
      const applications = await this.getCreditApplicationsUseCase.execute(filters);

      return {
        success: true,
        data: applications,
        total: applications.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener aplicaciones de crédito',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('my/applications')
  @UseGuards(ClerkAuthGuard)
  async getMyApplications(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const applications = await this.getCreditApplicationsUseCase.getByUser(
        user.id, 
        limit, 
        skip
      );

      return {
        success: true,
        data: applications,
        total: applications.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener tus aplicaciones',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @UseGuards(ClerkAuthGuard) // Solo admins deberían ver stats
  async getStats() {
    try {
      const stats = await this.getCreditApplicationsUseCase.getStats();

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener estadísticas',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async findOne(@Param('id') id: string) {
    try {
      const application = await this.getCreditApplicationsUseCase.getById(id);

      if (!application) {
        throw new HttpException(
          {
            success: false,
            message: 'Aplicación de crédito no encontrada'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: application
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener la aplicación',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/submit')
  @UseGuards(ClerkAuthGuard)
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCreditApplicationUseCase.submit(id, user.id);

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo enviar la aplicación'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Aplicación enviada para revisión'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al enviar la aplicación',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/approve')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async approve(
    @Param('id') id: string,
    @Body() reviewData: {
      approvedAmount?: number;
      approvedTerm?: number;
      interestRate?: number;
      monthlyPayment?: number;
      comments?: string;
    },
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCreditApplicationUseCase.approve(
        id,
        {
          ...reviewData,
          reviewedBy: user.id
        },
        user.id
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo aprobar la aplicación'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Aplicación aprobada exitosamente'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al aprobar la aplicación',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/reject')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async reject(
    @Param('id') id: string,
    @Body() reviewData: {
      rejectionReason: string;
      comments?: string;
    },
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCreditApplicationUseCase.reject(
        id,
        {
          ...reviewData,
          reviewedBy: user.id
        },
        user.id
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo rechazar la aplicación'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Aplicación rechazada'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al rechazar la aplicación',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/cancel')
  @UseGuards(ClerkAuthGuard)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCreditApplicationUseCase.cancel(id, user.id);

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo cancelar la aplicación'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Aplicación cancelada'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al cancelar la aplicación',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/documents')
  @UseGuards(ClerkAuthGuard)
  async addDocument(
    @Param('id') id: string,
    @Body() documentData: {
      url: string;
      type: string;
      name: string;
      size: number;
    },
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCreditApplicationUseCase.addDocument(
        id,
        documentData,
        user.id
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo agregar el documento'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Documento agregado exitosamente'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al agregar documento',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id/documents/:documentId')
  @UseGuards(ClerkAuthGuard)
  async removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCreditApplicationUseCase.removeDocument(
        id,
        documentId,
        user.id
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo eliminar el documento'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Documento eliminado'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al eliminar documento',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}