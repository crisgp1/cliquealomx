import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroContentController } from './hero-content.controller';
import { HeroContentService } from './hero-content.service';
import { HeroContent, HeroContentSchema } from './schemas/hero-content.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeroContent.name, schema: HeroContentSchema },
    ]),
  ],
  controllers: [HeroContentController],
  providers: [HeroContentService],
  exports: [HeroContentService],
})
export class HeroContentModule {}