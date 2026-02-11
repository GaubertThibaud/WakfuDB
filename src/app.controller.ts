import { BadRequestException, Controller, Get, Query} from '@nestjs/common';
import { AppService, CATEGORIES_FR } from './app.service';
import { ScraperController } from './scrapper/scrapper.controller';
import { MonsterService } from './monster/monster.service';
import { PrismaService } from './prisma/prisma.service';

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


  @Get("startScraperPage")
  async startScraperPage(@Query("category") category: string): Promise<void> {
    new ScraperController().scrapPageCategory(category);
  }

  @Get("test")
  async test() { 
    const monsterService = new MonsterService(new PrismaService());
    const test = await monsterService.findByName("chapo magik");
    const test2 = await monsterService.findByName("chapo magik");
    const test3 = await monsterService.findByName("chapo magik");
    console.log(test, test2, test3);
  }


  //unCommenting this endpoint if need be (but with the add of the @unique on the DB field should not happend again)
  /*@Get("sanitizeDB")
  async sanitizeDB() {
    this.appService.sanitizeDB();
  }*/

  
}