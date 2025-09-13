import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body,
  Param, 
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { HeroContentService } from './hero-content.service';
import { CreateHeroContentDto } from './dto/create-hero-content.dto';
import { HeroContent, MediaFile } from './schemas/hero-content.schema';

@Controller('hero-content')
export class HeroContentController {
  constructor(private readonly heroContentService: HeroContentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHeroContentDto: CreateHeroContentDto): Promise<HeroContent> {
    console.log('🔥 Creating hero content with data:', createHeroContentDto);
    const result = await this.heroContentService.create(createHeroContentDto);
    console.log('✅ Hero content created with ID:', (result as any).id || (result as any)._id);
    return result;
  }

  @Get()
  async findAll(): Promise<HeroContent[]> {
    console.log('📋 Fetching all hero content');
    return this.heroContentService.findAll();
  }

  @Get('active')
  async findActive(): Promise<HeroContent[]> {
    console.log('✨ Fetching active hero content');
    return this.heroContentService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HeroContent | null> {
    console.log('🔍 Fetching hero content by ID:', id);
    return this.heroContentService.findOne(id);
  }

  @Put('reorder')
  async reorder(@Body('ids') ids: string[]): Promise<{ success: boolean }> {
    console.log('🔀 Reordering hero content:', ids);
    await this.heroContentService.reorder(ids);
    return { success: true };
  }

  @Put(':id/toggle')
  async toggleActive(@Param('id') id: string): Promise<HeroContent | null> {
    console.log('🔄 Toggling active status for hero content:', id);
    return this.heroContentService.toggleActive(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateHeroContentDto>,
  ): Promise<HeroContent | null> {
    console.log('✏️ Updating hero content:', id, 'with data:', updateData);
    return this.heroContentService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    console.log('🗑️ Deleting hero content:', id);
    await this.heroContentService.remove(id);
    return { success: true };
  }

  @Put(':id/media')
  async updateMedia(
    @Param('id') id: string,
    @Body() updateData: { mediaFiles: MediaFile[]; loopMedia?: boolean },
  ): Promise<HeroContent | null> {
    console.log('🎬 Updating media for hero content:', id, 'with files:', updateData.mediaFiles?.length);
    return this.heroContentService.updateMedia(id, updateData.mediaFiles, updateData.loopMedia);
  }

  @Delete(':id/media/:mediaKey')
  async removeMedia(
    @Param('id') id: string,
    @Param('mediaKey') mediaKey: string,
  ): Promise<HeroContent | null> {
    console.log('🗑️ Removing media from hero content:', id, 'media key:', mediaKey);
    return this.heroContentService.removeMedia(id, mediaKey);
  }

  @Post('seed')
  async seedDefaultContent(): Promise<{ success: boolean }> {
    console.log('🌱 Seeding default hero content');
    await this.heroContentService.seedDefaultContent();
    return { success: true };
  }
}