import { Controller } from "@nestjs/common";
import { ListeItemsLinksService } from "./scrapperDbLogic/listeItemsLinks.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ScrapperMonsterService } from "./scrapper-monstre.service";
import { ListeItemsLinks } from "generated/prisma";

@Controller()
export class ScraperController {
    public async scrapPageCategory(type: string) {
        // TODO remove that debug ligne
        console.log(await new ListeItemsLinksService(new PrismaService()).getlisteType());

        const listeUrlCategory = await this.getListeUrlType(type);
        // TODO remove that debug ligne
        console.log(listeUrlCategory);

        await this.scrapPageRedirect(listeUrlCategory, type);
    }
    
    private async getListeUrlType(type: string) {
        return new ListeItemsLinksService(new PrismaService()).getlisteItemsLinks(type);
    }

    //Most page are unique depending on the categorie
    public async scrapPageRedirect(listeUrlCategory: ListeItemsLinks[], type: string) {

        console.log(type);

        switch (type) {
            case "monstres":
                const scrapperMonsterService = await ScrapperMonsterService.create();
                //scrapperMonsterService.test();
                scrapperMonsterService.main(listeUrlCategory);
                break;
            default:
                
                break;
        }

    }
}