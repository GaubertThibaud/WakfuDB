import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ScrapperService } from './scrapper/scrapper.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService, 
    private readonly scrapperService: ScrapperService
  ) {
    scrapperService = new ScrapperService();
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("getItem")
  async getItemTest() {
    //this.scrapperService.test();
    this.scrapperService.scrapperPagesList('armures');
  }
}