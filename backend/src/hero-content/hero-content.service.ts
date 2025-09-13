import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HeroContent, HeroContentDocument, MediaFile } from './schemas/hero-content.schema';
import { CreateHeroContentDto } from './dto/create-hero-content.dto';

@Injectable()
export class HeroContentService {
  constructor(
    @InjectModel(HeroContent.name) private heroContentModel: Model<HeroContentDocument>,
  ) {}

  async create(createHeroContentDto: CreateHeroContentDto): Promise<HeroContent> {
    const createdHeroContent = new this.heroContentModel(createHeroContentDto);
    return createdHeroContent.save();
  }

  async findAll(): Promise<HeroContent[]> {
    return this.heroContentModel.find().sort({ order: 1, createdAt: 1 }).exec();
  }

  async findActive(): Promise<HeroContent[]> {
    return this.heroContentModel
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .exec();
  }

  async findOne(id: string): Promise<HeroContent | null> {
    return this.heroContentModel.findById(id).exec();
  }

  async update(id: string, updateData: Partial<CreateHeroContentDto>): Promise<HeroContent | null> {
    return this.heroContentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async remove(id: string): Promise<void> {
    await this.heroContentModel.findByIdAndDelete(id).exec();
  }

  async toggleActive(id: string): Promise<HeroContent | null> {
    const heroContent = await this.heroContentModel.findById(id);
    if (!heroContent) return null;
    
    return this.heroContentModel.findByIdAndUpdate(
      id, 
      { isActive: !heroContent.isActive }, 
      { new: true }
    ).exec();
  }

  async reorder(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.heroContentModel.findByIdAndUpdate(ids[i], { order: i });
    }
  }

  async updateMedia(id: string, mediaFiles: MediaFile[], loopMedia?: boolean): Promise<HeroContent | null> {
    const updateData: any = { mediaFiles };
    if (loopMedia !== undefined) {
      updateData.loopMedia = loopMedia;
    }
    return this.heroContentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async removeMedia(id: string, mediaKey: string): Promise<HeroContent | null> {
    const heroContent = await this.heroContentModel.findById(id);
    if (!heroContent) return null;
    
    // Filtrar el archivo multimedia que se va a eliminar
    const updatedMediaFiles = heroContent.mediaFiles.filter(
      (media: MediaFile) => !media.url.includes(mediaKey)
    );
    
    return this.heroContentModel.findByIdAndUpdate(
      id, 
      { mediaFiles: updatedMediaFiles }, 
      { new: true }
    ).exec();
  }

  async seedDefaultContent(): Promise<void> {
    const count = await this.heroContentModel.countDocuments();
    if (count === 0) {
      const defaultContent = [
        {
          title: "Autos seminuevos, precios justos.",
          description: "Compra y vende autos seminuevos de manera simple, transparente y sin complicaciones.",
          isActive: true,
          order: 0
        },
        {
          title: "Calidad garantizada, confianza total.",
          description: "Cada vehículo pasa por una inspección rigurosa para asegurar tu tranquilidad.",
          isActive: true,
          order: 1
        },
        {
          title: "Tu auto ideal te está esperando.",
          description: "Explora nuestra selección de vehículos seminuevos con historial verificado.",
          isActive: true,
          order: 2
        },
        {
          title: "Vende fácil, compra inteligente.",
          description: "Proceso simplificado para que encuentres o vendas tu auto sin complicaciones.",
          isActive: true,
          order: 3
        }
      ];

      await this.heroContentModel.insertMany(defaultContent);
      console.log('✅ Default hero content seeded');
    }
  }
}