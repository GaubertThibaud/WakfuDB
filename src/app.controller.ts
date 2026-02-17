import { BadRequestException, Controller, Get, Query} from '@nestjs/common';
import { AppService, CATEGORIES_FR } from './app.service';
import { ScraperController } from './scrapper/scrapper.controller';
import { MonsterService } from './monster/monster.service';
import { PrismaService } from './prisma/prisma.service';
import { ItemService } from './items/item.service';

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
    const itemService = new ItemService(new PrismaService());
    const test1 = await itemService.findAllByName("Le Lumysceptre");
    const test2 = await monsterService.findByWakfuId(5664);
    const test3 = await itemService.findByWakfuId(32479);
    console.dir(test1);
    console.log(JSON.stringify(test2, null, 2));
    console.dir(test3);
  }


  //unCommenting this endpoint if need be (but with the add of the @unique on the DB field should not happend again)
  /*@Get("sanitizeDB")
  async sanitizeDB() {
    this.appService.sanitizeDB();
  }*/

  
}