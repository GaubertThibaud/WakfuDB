import { ListeItemsLinks } from "generated/prisma";
import { ScrapperService } from "./scrapper.service";
import { CFDecision } from "./metricsAnalyse";
import { CheerioAPI } from "cheerio";

export class ScrapperMonsterService {
    private scrapperService: ScrapperService;
    
    constructor() {
        this.scrapperService = new ScrapperService();

    }

    public async main(listeUrlCategory: ListeItemsLinks[]) {
        //Initialisation of the scrapper
        try {
            await this.scrapperService.scrapperInit();
        } catch(e) {
            console.log("Exiting scrapping due to fail of initialization");
            return
        }
        
        let decision: CFDecision = "OK";
        for(const urlCategory of listeUrlCategory) {
            //TODO check why url can still be null for some reason
            if(!urlCategory.url) {
                continue;
            }

            //TODO Catch les erreur et les save
            const { res, newDecision } = await this.scrapperService.scrapperRunner(decision, process.env.BASE_URL + urlCategory.url);
            decision = newDecision;

            const text = await this.scrapperService.simpleTextToHtml(await res.text());

            console.log(text);
            return;


        }
    }

    private getFamilly(text: CheerioAPI) {

    }

    private getUrlIcon(text: CheerioAPI) {

    }

    private getLvl(text: CheerioAPI) {

    }
    
    private getStats(text: CheerioAPI) {

    }

    private getCharacteristics(text: CheerioAPI) {

    }

    private getResistance(text: CheerioAPI) {
        
    }

    private isCatchable(text: CheerioAPI) {
        return false;
    }
    
    private getDrops(text: CheerioAPI) {

    }

    private getSpells(text: CheerioAPI) {

    }

    private getHarvest(text: CheerioAPI) {

    }
}