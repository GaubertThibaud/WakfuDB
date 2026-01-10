import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScrapperService } from './scrapper/scrapper.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ScrapperService],
})
export class AppModule {}
