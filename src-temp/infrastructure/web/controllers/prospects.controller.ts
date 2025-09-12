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
  BadRequestException
} from '@nestjs/common';
import { CreateProspectUseCase, CreateProspectDto } from '@application/use-cases/create-prospect.use-case';
import { GetProspectsUseCase } from '@application/use-cases/get-prospects.use-case';
import { ManageProspectUseCase } from '@application/use-cases/manage-prospect.use-case';
import { ProspectFilters } from '@domain/repositories/prospect.repository';
import { Prospect, Budget } from '@domain/entities/prospect.entity';
import { ClerkAuthGuard } from '@/infrastructure/guards/clerk-auth.guard';
import { CurrentUser, AuthUser } from '@/infrastructure/decorators/current-user.decorator';

@Controller('prospects')
@UseGuards(ClerkAuthGuard)
export class ProspectsController {
  constructor(
    private readonly createProspectUseCase: CreateProspectUseCase,
    private readonly getProspectsUseCase: GetProspectsUseCase,
    private readonly manageProspectUseCase: ManageProspectUseCase
  ) {}

  @Post()
  async createProspect(
    @Body() createProspectDto: CreateProspectDto,
    @CurrentUser() user: AuthUser
  ): Promise<Prospect> {
    const dto: CreateProspectDto = {
      ...createProspectDto,
      createdBy: user.userId
    };

    return await this.createProspectUseCase.execute(dto);
  }

  @Get()
  async getProspects(
    @Query() query: any,
    @CurrentUser() user: AuthUser
  ): Promise<Prospect[]> {
    const filters: ProspectFilters = {
      status: query.status,
      source: query.source,
      assignedTo: query.assignedTo || user.userId, // Default to current user
      search: query.search,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      isHot: query.isHot === 'true',
      isStale: query.isStale === 'true',
      hasAppointment: query.hasAppointment === 'true',
      limit: query.limit ? parseInt(query.limit) : 20,
      skip: query.skip ? parseInt(query.skip) : 0,
      sortBy: query.sortBy || 'recent'
    };

    return await this.getProspectsUseCase.execute(filters);
  }

  @Get('summaries')
  async getProspectSummaries(
    @Query() query: any,
    @Request() req: AuthenticatedRequest
  ): Promise<ReturnType<Prospect['toSummary']>[]> {
    const filters: ProspectFilters = {
      status: query.status,
      source: query.source,
      assignedTo: query.assignedTo || req.auth.userId,
      search: query.search,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      isHot: query.isHot === 'true',
      isStale: query.isStale === 'true',
      hasAppointment: query.hasAppointment === 'true',
      limit: query.limit ? parseInt(query.limit) : 20,
      skip: query.skip ? parseInt(query.skip) : 0,
      sortBy: query.sortBy || 'recent'
    };

    return await this.getProspectsUseCase.getSummaries(filters);
  }

  @Get('dashboard')
  async getDashboardData(@Request() req: AuthenticatedRequest): Promise<any> {
    return await this.getProspectsUseCase.getDashboardData(req.auth.userId);
  }

  @Get('stats')
  async getStats(): Promise<any> {
    return await this.getProspectsUseCase.getStats();
  }

  @Get('hot')
  async getHotProspects(
    @Query('limit') limit?: string
  ): Promise<Prospect[]> {
    const limitNum = limit ? parseInt(limit) : 10;
    return await this.getProspectsUseCase.getHotProspects(limitNum);
  }

  @Get('stale')
  async getStaleProspects(
    @Query('limit') limit?: string
  ): Promise<Prospect[]> {
    const limitNum = limit ? parseInt(limit) : 10;
    return await this.getProspectsUseCase.getStaleProspects(limitNum);
  }

  @Get('new')
  async getNewProspects(
    @Query('limit') limit?: string
  ): Promise<Prospect[]> {
    const limitNum = limit ? parseInt(limit) : 20;
    return await this.getProspectsUseCase.getNewProspects(limitNum);
  }

  @Get('appointments')
  async getAppointments(
    @Query('assignedTo') assignedTo?: string,
    @Request() req?: AuthenticatedRequest
  ): Promise<Prospect[]> {
    const userId = assignedTo || (req ? req.auth.userId : undefined);
    return await this.getProspectsUseCase.getAppointments(userId);
  }

  @Get('by-status/:status')
  async getByStatus(
    @Param('status') status: string,
    @Query('assignedTo') assignedTo?: string,
    @Request() req?: AuthenticatedRequest
  ): Promise<Prospect[]> {
    const userId = assignedTo || (req ? req.auth.userId : undefined);
    return await this.getProspectsUseCase.getByStatus(status as any, userId);
  }

  @Get('by-source/:source')
  async getBySource(
    @Param('source') source: string,
    @Query('assignedTo') assignedTo?: string,
    @Request() req?: AuthenticatedRequest
  ): Promise<Prospect[]> {
    const userId = assignedTo || (req ? req.auth.userId : undefined);
    return await this.getProspectsUseCase.getBySource(source as any, userId);
  }

  @Get('report')
  async generateReport(
    @Query() query: any
  ): Promise<any> {
    const filters = {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      status: query.status,
      source: query.source,
      assignedTo: query.assignedTo
    };

    return await this.manageProspectUseCase.generateReport(filters);
  }

  @Get(':id')
  async getProspectById(@Param('id') id: string): Promise<Prospect | null> {
    return await this.getProspectsUseCase.getById(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: Prospect['status'] },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    if (!body.status) {
      throw new BadRequestException('Status es requerido');
    }

    const success = await this.manageProspectUseCase.updateStatus(
      id,
      body.status,
      req.auth.userId
    );

    return { success };
  }

  @Put(':id/appointment')
  async scheduleAppointment(
    @Param('id') id: string,
    @Body() body: { appointmentDate: string; notes?: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    if (!body.appointmentDate) {
      throw new BadRequestException('Fecha de cita es requerida');
    }

    const success = await this.manageProspectUseCase.scheduleAppointment(
      id,
      new Date(body.appointmentDate),
      body.notes,
      req.auth.userId
    );

    return { success };
  }

  @Put(':id/contact')
  async updateContactInfo(
    @Param('id') id: string,
    @Body() updates: {
      name?: string;
      phone?: string;
      email?: string;
    },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const success = await this.manageProspectUseCase.updateContactInfo(
      id,
      updates,
      req.auth.userId
    );

    return { success };
  }

  @Put(':id/interest')
  async updateInterest(
    @Param('id') id: string,
    @Body() updates: {
      interestedListingId?: string;
      interestedListingTitle?: string;
      manualListingDescription?: string;
      budget?: Budget;
    },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const success = await this.manageProspectUseCase.updateInterest(
      id,
      updates,
      req.auth.userId
    );

    return { success };
  }

  @Put(':id/notes')
  async updateNotes(
    @Param('id') id: string,
    @Body() body: { notes: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    if (body.notes === undefined) {
      throw new BadRequestException('Notes son requeridas');
    }

    const success = await this.manageProspectUseCase.updateNotes(
      id,
      body.notes,
      req.auth.userId
    );

    return { success };
  }

  @Post(':id/tags')
  async addTag(
    @Param('id') id: string,
    @Body() body: { tag: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    if (!body.tag) {
      throw new BadRequestException('Tag es requerido');
    }

    const success = await this.manageProspectUseCase.addTag(
      id,
      body.tag,
      req.auth.userId
    );

    return { success };
  }

  @Delete(':id/tags')
  async removeTag(
    @Param('id') id: string,
    @Body() body: { tag: string },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    if (!body.tag) {
      throw new BadRequestException('Tag es requerido');
    }

    const success = await this.manageProspectUseCase.removeTag(
      id,
      body.tag,
      req.auth.userId
    );

    return { success };
  }

  @Put(':id/reassign')
  async reassignProspect(
    @Param('id') id: string,
    @Body() body: { 
      newAssignee: string; 
      reason: string;
    },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    if (!body.newAssignee || !body.reason) {
      throw new BadRequestException('newAssignee y reason son requeridos');
    }

    const success = await this.manageProspectUseCase.reassignProspect(
      id,
      body.newAssignee,
      req.auth.userId,
      body.reason
    );

    return { success };
  }

  @Put('bulk')
  async bulkUpdate(
    @Body() body: {
      prospectIds: string[];
      updates: {
        status?: Prospect['status'];
        assignedTo?: string;
        tags?: string[];
      };
    },
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    if (!body.prospectIds || !Array.isArray(body.prospectIds)) {
      throw new BadRequestException('prospectIds debe ser un array');
    }

    if (!body.updates || Object.keys(body.updates).length === 0) {
      throw new BadRequestException('updates es requerido');
    }

    return await this.manageProspectUseCase.bulkUpdate(
      body.prospectIds,
      body.updates,
      req.auth.userId
    );
  }

  @Delete(':id')
  async deleteProspect(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    const success = await this.manageProspectUseCase.delete(id, req.auth.userId);
    return { success };
  }

  @Get(':id/ownership')
  async validateOwnership(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ): Promise<{ hasAccess: boolean }> {
    const hasAccess = await this.manageProspectUseCase.validateOwnership(
      id,
      req.auth.userId
    );

    return { hasAccess };
  }
}