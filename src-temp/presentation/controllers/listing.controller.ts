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
import { CreateListingUseCase, CreateListingDto } from '@application/use-cases/create-listing.use-case';
import { GetListingsUseCase } from '@application/use-cases/get-listings.use-case';
import { ListingFilters } from '@domain/repositories/listing.repository';
import { ClerkAuthGuard } from '@presentation/guards/clerk-auth.guard';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';

@Controller('api/listings')
export class ListingController {
  constructor(
    private readonly createListingUseCase: CreateListingUseCase,
    private readonly getListingsUseCase: GetListingsUseCase,
  ) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(
    @Body() createListingDto: CreateListingDto,
    @CurrentUser() user: any
  ) {
    try {
      const listing = await this.createListingUseCase.execute({
        ...createListingDto,
        userId: user.id
      });

      return {
        success: true,
        data: listing,
        message: 'Listing creado exitosamente'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al crear el listing',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(@Query() filters: ListingFilters) {
    try {
      const listings = await this.getListingsUseCase.execute(filters);

      return {
        success: true,
        data: listings,
        total: listings.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener listings',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('featured')
  async getFeatured(@Query('limit') limit?: number) {
    try {
      const listings = await this.getListingsUseCase.getFeatured(limit);

      return {
        success: true,
        data: listings,
        total: listings.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener listings destacados',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('user/:userId')
  async getByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const listings = await this.getListingsUseCase.getByUser(userId, limit, skip);

      return {
        success: true,
        data: listings,
        total: listings.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener listings del usuario',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const listing = await this.getListingsUseCase.execute({ userId: id });

      if (!listing) {
        throw new HttpException(
          {
            success: false,
            message: 'Listing no encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: listing
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener el listing',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/similar')
  async getSimilar(
    @Param('id') id: string,
    @Query('limit') limit?: number
  ) {
    try {
      const listings = await this.getListingsUseCase.getSimilar(id, limit);

      return {
        success: true,
        data: listings,
        total: listings.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener listings similares',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('my/listings')
  @UseGuards(ClerkAuthGuard)
  async getMyListings(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    try {
      const listings = await this.getListingsUseCase.getByUser(user.id, limit, skip);

      return {
        success: true,
        data: listings,
        total: listings.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error al obtener tus listings',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}