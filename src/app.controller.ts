import { BadRequestException, Controller, Get, Query} from '@nestjs/common';
import { AppService, CATEGORIES_FR } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService, 
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // TODO refactor dor DTO use
  @Get("startScraper")
  async startScraper(@Query("category") category: string): Promise <void> {
    if (!category) {
        throw new BadRequestException('Missing parameter: category');
    }

    if (!CATEGORIES_FR.includes(category)) {
        throw new BadRequestException('Wrong parameter: category');
    }
    return this.appService.startScraperList(category); 
  }

  @Get("sanitizeDB")
  async sanitizeDB() {
    this.appService.sanitizeDB();
  }

  
}