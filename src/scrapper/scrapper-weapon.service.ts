import { ListeItemsLinks } from "generated/prisma";
import { MapperStats } from "./mapper/stat-mapper";
import { ScrapperService } from "./scrapper.service";
import { CFDecision } from "./metricsAnalyse";

export class ScrapperWeaponService {
    private scrapperService: ScrapperService;
    private mapperStat: MapperStats;

    private constructor(scrapperService: ScrapperService, mapperStat: MapperStats) {
        this.scrapperService = scrapperService
        this.mapperStat = mapperStat
    }

    public static async create() {
        const scrapperService = new ScrapperService();
        const mapperStat = await MapperStats.create();

        return new ScrapperWeaponService(scrapperService, mapperStat);
    }

    public async main(listeUrlCategory: ListeItemsLinks[]) {
        console.log("TEST")
        console.log(listeUrlCategory);


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

            if(!urlCategory.nameFr) {
                continue;
            }

            const { res, newDecision } = await this.scrapperService.scrapperRunner(decision, process.env.BASE_URL + urlCategory.url);
            decision = newDecision;
         
            
            return
        }
    }


    private getConditions() {
        
    }

    private getStats() {

    }
}