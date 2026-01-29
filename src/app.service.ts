import { Injectable } from '@nestjs/common';
import { ScrapperService } from './scrapper/scrapper.service';
import { PrismaService } from './prisma/prisma.service';
import { MonsterService } from './monster/monster.service';

// Categorie not used : compagnons / classes / metiers
export const CATEGORIES_FR = [
    "armures",
    "armes",
    "personnalisation",
    "accessoires",
    "consommables",
    "ressources",
    "montures",
    "divers",
    "familiers",
    "monstres",
];

@Injectable()
export class AppService {
    getHello(): string {
        return 'Hello World!';

        const monsterService = new MonsterService(new PrismaService());
        monsterService.create({name:"test", })
    }

    async startScraperList(category: string) {
      let scrapperService = new ScrapperService();
      scrapperService.scrapperPagesList(category);
      //this.scrapperService.test();
    }

    //Runing the scrapper manually gave me duplicates of some items and i want to clean everything before getting the EN and ES names

    async sanitizeDB() {
      const prismaService = new PrismaService();
      const res = await prismaService.sanitizeDB();
      console.log(res.length);
      console.log(res);
    }
}




    
  