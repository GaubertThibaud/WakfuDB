import { ListeItemsLinks } from "generated/prisma";
import { MapperStats } from "./mapper/stat-mapper";
import { ScrapperService } from "./scrapper.service";
import { CFDecision } from "./metricsAnalyse";
import { CheerioAPI } from "cheerio";
import { getDescription, getLvl, getRarete, getType, getUrlIcon, getWakfuId } from "./scrapper.helper";
import { damageTypeMapper } from "./mapper/damageType-mapper";

interface DropSource {
  name: string;
  wakfuId: number;
  dropRate: number;
}

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
        for(let urlCategory of listeUrlCategory) {

            //urlCategory.url = "/fr/mmorpg/encyclopedie/armes/32333-arc-freyrr";

            //TODO check why url can still be null for some reason
            if(!urlCategory.url) {
                continue;
            }

            if(!urlCategory.nameFr) {
                continue;
            }

            const { res, newDecision } = await this.scrapperService.scrapperRunner(decision, process.env.BASE_URL + urlCategory.url);
            decision = newDecision;
         
            const text = await this.scrapperService.simpleTextToHtml(await res.text());

            const type = getType(text);
            const urlIcon = getUrlIcon(text);
            const { lvlMin, lvlMax } = getLvl(text);
            const wakfuId = getWakfuId(urlCategory.url);
            const rarete = getRarete(text);
            const description = getDescription(text);
            const stats = this.getStatistics(text);
            const dropFrom = this.getDropFrom(text);
            const recipeFor = "";
            const recipeFrom = "";
            
            console.log(urlCategory)
            console.log(dropFrom);

            return
        }
    }


    private getStatistics($: CheerioAPI) {
        const result = {
            costs: this.getCout($),
            damages: this.getDamage($),
            stat: this.getStat($),
        }
        return result;
    }

    private getDropFrom($: CheerioAPI): DropSource[] {
        const drops: DropSource[] = [];

        $('.ak-panel-title')
            .filter((_, el) =>
            $(el).text().replace(/\s+/g, ' ').trim() === 'Peut être obtenu sur'
            )
            .closest('.ak-panel')
            .find('.ak-list-element')
            .each((_, el) => {
            const anchor = $(el).find('.ak-title a');

            const name = anchor.find('.ak-linker').first().text().trim();

            const href = anchor.attr('href');
            const idMatch = href?.match(/monstres\/(\d+)-/);
            const wakfuId = idMatch ? Number(idMatch[1]) : null;

            const dropText = $(el).children('.ak-main')
                .find('.ak-aside')
                .first()
                .text()
                .trim();
            const dropRate = Number(dropText.replace('%', ''));

            if (name && wakfuId && !isNaN(dropRate)) {
                drops.push({ name, wakfuId, dropRate });
            }
            });

        return drops;
    }

    private getCout($: CheerioAPI): Record<string, number> {
        const costs: Record<string, number> = {};

        $('.ak-panel-title')
            .filter((_, el) =>
            $(el).text().replace(/\s+/g, ' ').trim() === 'Coûts'
            )
            .closest('.ak-panel')
            .find('.ak-title')
            .each((_, el) => {
                const label = $(el)
                    .contents()
                    .first()
                    .text()
                    .replace(':', '')
                    .trim();

                const value = Number(
                    $(el).find('.ak-title-info').text().trim()
                );
                if (label && !isNaN(value)) {
                    const normalizedLabel = this.mapperStat.mapStatKey(label.toUpperCase());
                
                    if (normalizedLabel) {
                        costs["COUT_" + normalizedLabel] = value;
                    }
                }
            });

        return costs;
    }

    private getStat($: CheerioAPI): Record<string, number> {
        let stats: Record<string, number> = {};

        $('.ak-panel')
            //On ignore le panel "Coûts"
            .not((_, el) =>
                $(el).find('.ak-panel-title').text().includes('Coûts')
            )
            .find('.ak-title')
            .each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();

            //On ignore les "dommages"
            if (text.includes('Dommage')) {
                return;
            }

            const match = text.match(/^(\d+)\s+(.+)$/);
            if (!match) return;
                const value = Number(match[1]);
                const label = match[2].toUpperCase();
                const normalizedLabel = this.mapperStat.mapStatKey(label.toUpperCase());
                if (normalizedLabel) {
                    stats[normalizedLabel] = value;
                }
            });

        return stats;
    }

    private getDamage($: CheerioAPI): { value: number, type: string }[] {
        let damages: { value: number, type: string }[] = [];
        $('.ak-title')
            .filter((_, el) => $(el).text().includes('Dommage'))
            .each((_, el) => {
                const title = $(el).text().replace(/\s+/g, ' ').trim();

                const valueMatch = title.match(/\d+/);
                const value = valueMatch ? Number(valueMatch[0]) : null;

                // Cherche l'image dans le même bloc
                const icon = $(el)
                    .closest('.ak-main-content')
                    .find('img')
                    .first()
                    .attr('src');

                let type: string = "NO ICON FOR TYPE FOUND";

                if (icon) {
                    const typeMatch = icon.match(/element\/(.*?)\.png/i);
                    type = typeMatch ? typeMatch[1].toUpperCase() : "NO TYPE FOUND";
                }
                //No empty string in the DB !
                type = damageTypeMapper(type);

                if (value && type) {
                    damages.push({ value, type });
                }
            });
        return damages;
    }
}