import { MediaFile } from '../schemas/hero-content.schema';

export class CreateHeroContentDto {
  title: string;
  description: string;
  isActive?: boolean;
  order?: number;
  mediaFiles?: MediaFile[];
  loopMedia?: boolean;
}