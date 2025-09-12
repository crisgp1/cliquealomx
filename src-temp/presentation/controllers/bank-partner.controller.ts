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
  CreateBankPartnerUseCase, 
  CreateBankPartnerDto 
} from '@application/use-cases/create-bank-partner.use-case';
import { GetBankPartnersUseCase } from '@application/use-cases/get-bank-partners.use-case';
import { ManageBankPartnerUseCase } from '@application/use-cases/manage-bank-partner.use-case';
import { BankPartnerFilters } from '@domain/repositories/bank-partner.repository';
import { ClerkAuthGuard } from '@presentation/guards/clerk-auth.guard';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';

@Controller('api/bank-partners')
export class BankPartnerController {
  constructor(
    private readonly createBankPartnerUseCase: CreateBankPartnerUseCase,
    private readonly getBankPartnersUseCase: GetBankPartnersUseCase,
    private readonly manageBankPartnerUseCase: ManageBankPartnerUseCase,
  ) {}

  @Post()
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async create(
    @Body() createBankPartnerDto: CreateBankPartnerDto,
    @CurrentUser() user: any
  ) {
    try {
      const bankPartner = await this.createBankPartnerUseCase.execute({
        ...createBankPartnerDto,
        createdBy: user.id
      });

      return {
        success: true,
        data: bankPartner,
        message: 'Aliado bancario creado exitosamente'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al crear aliado bancario',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query() filters: BankPartnerFilters) {
    try {
      const bankPartners = await this.getBankPartnersUseCase.execute(filters);

      return {
        success: true,
        data: bankPartners,
        total: bankPartners.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener aliados bancarios',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('active')
  async getActive() {
    try {
      const bankPartners = await this.getBankPartnersUseCase.getActiveOnly();

      return {
        success: true,
        data: bankPartners,
        total: bankPartners.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener aliados activos',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('simulator')
  async getForSimulator() {
    try {
      const bankPartners = await this.manageBankPartnerUseCase.getActiveForSimulator();

      return {
        success: true,
        data: bankPartners,
        total: bankPartners.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener opciones para simulador',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('simulator/vehicle/:year')
  async getForVehicleYear(@Param('year') year: number) {
    try {
      const bankPartners = await this.manageBankPartnerUseCase.getActiveForVehicleYear(year);

      return {
        success: true,
        data: bankPartners,
        total: bankPartners.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener opciones para el año del vehículo',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('best-match')
  async findBestMatch(
    @Body() filters: {
      amount: number;
      term: number;
      vehicleYear?: number;
    }
  ) {
    try {
      const bestOptions = await this.manageBankPartnerUseCase.findBestOptions(filters);

      return {
        success: true,
        data: bestOptions,
        total: bestOptions.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al buscar mejores opciones',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/quote')
  async calculateQuote(
    @Param('id') id: string,
    @Body() quoteData: {
      amount: number;
      term: number;
      vehicleYear?: number;
    }
  ) {
    try {
      const quote = await this.manageBankPartnerUseCase.calculateQuote(
        id,
        quoteData.amount,
        quoteData.term,
        quoteData.vehicleYear
      );

      return {
        success: true,
        data: quote
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al calcular cotización',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async getStats() {
    try {
      const stats = await this.getBankPartnersUseCase.getStats();

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

  @Get('incidents/stats')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async getIncidentStats() {
    try {
      const incidentStats = await this.getBankPartnersUseCase.getIncidentStats();

      return {
        success: true,
        data: incidentStats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener estadísticas de incidencias',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const bankPartner = await this.getBankPartnersUseCase.getById(id);

      if (!bankPartner) {
        throw new HttpException(
          {
            success: false,
            message: 'Aliado bancario no encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: bankPartner
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener aliado bancario',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/rate')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async updateCreditRate(
    @Param('id') id: string,
    @Body() rateData: { creditRate: number }
  ) {
    try {
      const success = await this.manageBankPartnerUseCase.updateCreditRate(
        id,
        rateData.creditRate
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo actualizar la tasa de interés'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Tasa de interés actualizada'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al actualizar tasa de interés',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/vehicle-year')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async updateMinVehicleYear(
    @Param('id') id: string,
    @Body() yearData: { minVehicleYear: number | null }
  ) {
    try {
      const success = await this.manageBankPartnerUseCase.updateMinVehicleYear(
        id,
        yearData.minVehicleYear
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo actualizar el año mínimo'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Año mínimo del vehículo actualizado'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al actualizar año mínimo',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/toggle-active')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async toggleActive(@Param('id') id: string) {
    try {
      const success = await this.manageBankPartnerUseCase.toggleActive(id);

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo cambiar el estado'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Estado actualizado'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al cambiar estado',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/incidents')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async reportIncident(
    @Param('id') id: string,
    @Body() incidentData: {
      type: string;
      description: string;
      severity: string;
    },
    @CurrentUser() user: any
  ) {
    try {
      const incident = await this.manageBankPartnerUseCase.reportIncident(id, {
        ...incidentData,
        type: incidentData.type as any,
        severity: incidentData.severity as any,
        reportedBy: user.id
      });

      return {
        success: true,
        data: incident,
        message: 'Incidencia reportada exitosamente'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al reportar incidencia',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/incidents/:incidentId/resolve')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async resolveIncident(
    @Param('id') id: string,
    @Param('incidentId') incidentId: string,
    @Body() resolveData: { notes?: string },
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageBankPartnerUseCase.resolveIncident(
        id,
        incidentId,
        user.id,
        resolveData.notes
      );

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo resolver la incidencia'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Incidencia resuelta'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al resolver incidencia',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/incidents')
  @UseGuards(ClerkAuthGuard) // TODO: Add AdminGuard
  async getIncidents(
    @Param('id') id: string,
    @Query() filters: {
      resolved?: string;
      type?: string;
      severity?: string;
      limit?: string;
    }
  ) {
    try {
      const incidents = await this.manageBankPartnerUseCase.getIncidents(id, {
        resolved: filters.resolved === 'true' ? true : filters.resolved === 'false' ? false : undefined,
        type: filters.type as any,
        severity: filters.severity as any,
        limit: filters.limit ? parseInt(filters.limit) : undefined
      });

      return {
        success: true,
        data: incidents,
        total: incidents.length
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener incidencias',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}