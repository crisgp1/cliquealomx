import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Core modules
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules
import { ListingsModule } from './listings/listings.module';
import { UploadModule } from './upload/upload.module';
import { HeroContentModule } from './hero-content/hero-content.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        retryWrites: true,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    ListingsModule,
    UploadModule,
    HeroContentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
