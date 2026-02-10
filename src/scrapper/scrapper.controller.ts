import { BadRequestException, Controller } from "@nestjs/common";
import { ListeItemsLinksService } from "./scrapperDbLogic/listeItemsLinks.service";
import { PrismaService } from "src/prisma/prisma.service";
import { ScrapperMonsterService } from "./scrapper-monster.service";
import { ListeItemsLinks } from "generated/prisma";
import { ScrapperWeaponService } from "./scrapper-weapon.service";
import { getTypesFromMetaType } from "./mapper/metaType-mapper";

@Controller()
export class ScraperController {
    public async scrapPageCategory(metaType: string) {
        // TODO remove that debug ligne
        //console.log(await new ListeItemsLinksService(new PrismaService()).getlisteType());

        const listeUrlCategory = await this.getListeUrlType(metaType);
        // TODO remove that debug ligne
        console.log(listeUrlCategory);

        await this.scrapPageRedirect(listeUrlCategory, metaType);
    }
    
    private async getListeUrlType(metaType: string) {
        //That is what we call Technical debt
        const typeList = getTypesFromMetaType(metaType.toUpperCase()).map(s => s.toLowerCase().replace(/_/g, ' '));
        if (!typeList || typeList.length === 0) {
            throw new BadRequestException({
                code: 'INVALID_INPUT',
                message: 'category is wrong !',
            });
        }
        
        return await new ListeItemsLinksService(new PrismaService()).getlisteItemsLinksFromTypes(typeList);
    }

    //Most page are unique depending on the categorie
    public async scrapPageRedirect(listeUrlCategory: ListeItemsLinks[], metaType: string) {

        console.log(metaType);

        switch (metaType) {
            case "monstres":
                const scrapperMonsterService = await ScrapperMonsterService.create();
                await scrapperMonsterService.main(listeUrlCategory);
                await scrapperMonsterService.verifyScrapping(listeUrlCategory);
                break;
            case "armes":
                const scrapperWeaponService = await ScrapperWeaponService.create();
                await scrapperWeaponService.main(listeUrlCategory)
                break;
            default:
                
                break;
        }

    }
}