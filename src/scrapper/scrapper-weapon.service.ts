import { ListeItemsLinks } from "generated/prisma";
import { MapperStats } from "./mapper/stat-mapper";
import { ScrapperService } from "./scrapper.service";

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

    }

}