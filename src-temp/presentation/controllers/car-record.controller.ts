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
  CreateCarRecordUseCase, 
  CreateCarRecordDto 
} from '@application/use-cases/create-car-record.use-case';
import { GetCarRecordsUseCase } from '@application/use-cases/get-car-records.use-case';
import { ManageCarRecordUseCase } from '@application/use-cases/manage-car-record.use-case';
import { CarRecordFilters } from '@domain/repositories/car-record.repository';
import { DocumentFile, SaleData } from '@domain/entities/car-record.entity';
import { ClerkAuthGuard } from '@presentation/guards/clerk-auth.guard';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';

@Controller('api/car-records')
export class CarRecordController {
  constructor(
    private readonly createCarRecordUseCase: CreateCarRecordUseCase,
    private readonly getCarRecordsUseCase: GetCarRecordsUseCase,
    private readonly manageCarRecordUseCase: ManageCarRecordUseCase,
  ) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(
    @Body() createCarRecordDto: CreateCarRecordDto,
    @CurrentUser() user: any
  ) {
    try {
      const carRecord = await this.createCarRecordUseCase.execute({
        ...createCarRecordDto,
        createdBy: user.id
      });

      return {
        success: true,
        data: carRecord,
        message: 'Registro creado exitosamente'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al crear el registro',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  async findAll(@Query() filters: CarRecordFilters) {
    try {
      const records = await this.getCarRecordsUseCase.execute(filters);

      return {
        success: true,
        data: records,
        total: records.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener registros',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('summaries')
  @UseGuards(ClerkAuthGuard)
  async getSummaries(@Query() filters: CarRecordFilters) {
    try {
      const summaries = await this.getCarRecordsUseCase.getSummaries(filters);

      return {
        success: true,
        data: summaries,
        total: summaries.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener resúmenes',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('my/records')
  @UseGuards(ClerkAuthGuard)
  async getMyRecords(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const records = await this.getCarRecordsUseCase.getByCreator(
        user.id, 
        limit, 
        skip
      );

      return {
        success: true,
        data: records,
        total: records.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener tus registros',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sales')
  @UseGuards(ClerkAuthGuard)
  async getSalesOnly(@Query() filters: Omit<CarRecordFilters, 'isSale'>) {
    try {
      const sales = await this.getCarRecordsUseCase.getSalesOnly(filters);

      return {
        success: true,
        data: sales,
        total: sales.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener registros de ventas',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  @UseGuards(ClerkAuthGuard)
  async getStats() {
    try {
      const stats = await this.getCarRecordsUseCase.getStats();

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

  @Post('report')
  @UseGuards(ClerkAuthGuard)
  async generateReport(
    @Body() filters: {
      dateFrom?: string;
      dateTo?: string;
      isSale?: boolean;
    },
    @CurrentUser() user: any
  ) {
    try {
      const reportFilters = {
        ...filters,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        createdBy: user.id // Only user's own records
      };

      const report = await this.manageCarRecordUseCase.generateReport(reportFilters);

      return {
        success: true,
        data: report
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al generar reporte',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('expedient/:expedientNumber')
  @UseGuards(ClerkAuthGuard)
  async findByExpedientNumber(@Param('expedientNumber') expedientNumber: string) {
    try {
      const record = await this.getCarRecordsUseCase.getByExpedientNumber(expedientNumber);

      if (!record) {
        throw new HttpException(
          {
            success: false,
            message: 'Registro no encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: record
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener registro por expediente',
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
      const record = await this.getCarRecordsUseCase.getById(id);

      if (!record) {
        throw new HttpException(
          {
            success: false,
            message: 'Registro no encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: record
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener registro',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      title?: string;
      notes?: string;
      saleData?: SaleData;
    },
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCarRecordUseCase.update(id, updateData, user.id);

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo actualizar el registro'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Registro actualizado exitosamente'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al actualizar registro',
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
    @Body() document: DocumentFile,
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCarRecordUseCase.addDocument(id, document, user.id);

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

  @Delete(':id/documents/:documentName')
  @UseGuards(ClerkAuthGuard)
  async removeDocument(
    @Param('id') id: string,
    @Param('documentName') documentName: string,
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCarRecordUseCase.removeDocument(
        id, 
        decodeURIComponent(documentName), 
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

  @Get(':id/documents/:type')
  @UseGuards(ClerkAuthGuard)
  async getDocumentsByType(
    @Param('id') id: string,
    @Param('type') type: 'image' | 'pdf',
    @CurrentUser() user: any
  ) {
    try {
      const documents = await this.manageCarRecordUseCase.getDocumentsByType(
        id, 
        type, 
        user.id
      );

      return {
        success: true,
        data: documents,
        total: documents.length
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener documentos',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/duplicate')
  @UseGuards(ClerkAuthGuard)
  async duplicate(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    try {
      const duplicatedRecord = await this.manageCarRecordUseCase.duplicate(id, user.id);

      return {
        success: true,
        data: duplicatedRecord,
        message: 'Registro duplicado exitosamente'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al duplicar registro',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    try {
      const success = await this.manageCarRecordUseCase.delete(id, user.id);

      if (!success) {
        throw new HttpException(
          {
            success: false,
            message: 'No se pudo eliminar el registro'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        message: 'Registro eliminado'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Error al eliminar registro',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}