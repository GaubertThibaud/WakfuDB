import { ListeItemsLinks } from "generated/prisma";
import { ScrapperService } from "./scrapper.service";
import { CFDecision } from "./metricsAnalyse";
import { CheerioAPI } from "cheerio";
import { mapRarity } from "./mapper/rarity-mapper";
import { getMetaTypeFromType, isValidMetaType } from "./mapper/metaType-mapper";
import { MapperStats } from "./mapper/stat-mapper";

interface HarvestItem {
    name: string;
    urlIcon: string;
    level: string;
    trapperLevel: string; 
}

export class ScrapperMonsterService {
    private scrapperService: ScrapperService;
    private mapperStat: MapperStats;

    private constructor(scrapperService: ScrapperService, mapperStat: MapperStats) {
        this.scrapperService = scrapperService
        this.mapperStat = mapperStat
    }

    public static async create() {
        const scrapperService = new ScrapperService();
        const mapperStat = await MapperStats.create();

        return new ScrapperMonsterService(scrapperService, mapperStat);
    }

    public test() { 
        console.log(this.mapperStat.listStats);
    }

    public async main(listeUrlCategory: ListeItemsLinks[]) {
        //Initialisation of the scrapper
        try {
            await this.scrapperService.scrapperInit();
        } catch(e) {
            console.log("Exiting scrapping due to fail of initialization");
            return
        }
        
        let i = 0;

        let decision: CFDecision = "OK";
        for(const urlCategory of listeUrlCategory) {
            i ++;
            //TODO check why url can still be null for some reason
            if(!urlCategory.url) {
                continue;
            }

            //TODO Catch les erreur et les save
            const { res, newDecision } = await this.scrapperService.scrapperRunner(decision, process.env.BASE_URL + urlCategory.url);
            decision = newDecision;

            const text = await this.scrapperService.simpleTextToHtml(await res.text());

            //Exctrating all the values
            const familly = this.getFamilly(text);
            const urlIcon = this.getUrlIcon(text);
            const { lvlMin, lvlMax } = this.getLvl(text);
            const stats = this.getStats(text);
            const catchable = this.isCatchable(text);
            const drops = this.getDrops(text);
            const spells = this.getSpells(text);
            const harvest = this.getHarvest(text);

            const monster = {
                name: urlCategory.nameFr,
                familly: familly,
                urlIcon: urlIcon,
                lvlMax: lvlMax,
                lvlMin: lvlMin,
                stats: stats,
                catchable: catchable,
                drops: drops,
                spells: spells,
                harvest: harvest,
            }

            console.log(monster);

            if ( i > 5) {
                return;
            }
            //return;
        }
    }

    private getFamilly($: CheerioAPI) {
        return $('.ak-encyclo-detail-type span')
            .first()
            .text()
            .trim();
    }

    private getUrlIcon($: CheerioAPI) {
        const img = $('.ak-encyclo-detail-illu img');

        const imageUrl = img.attr('data-src') || img.attr('src') || null;
        const image = imageUrl
        ? new URL(imageUrl, 'https://static.ankama.com').href
        : null;

        return image;
    }

    private getLvl($: CheerioAPI) {
        const text = $('.ak-encyclo-detail-level').text().trim();

        const numbers = text.match(/\d+/g)?.map(Number) ?? [];

        let lvlMin: number | null = null;
        let lvlMax: number | null = null;

        if (numbers.length === 1) {
            lvlMin = numbers[0];
            lvlMax = numbers[0];
        } else if (numbers.length >= 2) {
            lvlMin = numbers[0];
            lvlMax = numbers[1];
        }

        return { lvlMin, lvlMax };
    }
    
    private getStats($: CheerioAPI) {
        const carac = this.getCharacteristics($);
        const res = this.getResistance($);
        return { ...carac, ...res };
    }

    private getCharacteristics($: CheerioAPI) {
        const characteristics: Record<string, number> = {};

        $('.ak-panel')
            .filter((_, el) =>
            $(el).find('.ak-panel-title').text().includes('Caractéristiques')
            )
            .find('.ak-list-element')
            .each((_, el) => {
                const title = $(el)
                    .find('.ak-title')
                    .clone()
                    .children()
                    .remove()
                    .end()
                    .text()
                    .replace(':', '')
                    .trim();

                const value = Number(
                    $(el).find('.ak-title span').text().trim()
                );

                const key = this.mapperStat.mapStatKey(title);
                if (key && !Number.isNaN(value)) {
                    characteristics[key] = value;
                }
            });

        return characteristics;
    }

    private getResistance($: CheerioAPI) {
        const stats: Record<string, number> = {};

        $('.ak-panel')
            .filter((_, el) =>
            $(el).find('.ak-panel-title').text().includes('Résistances')
            )
            .find('.ak-list-element')
            .each((_, el) => {
                const elementClass = $(el)
                .find('.ak-aside span')
                .attr('class') ?? '';

                const element = this.mapElementFromClass(elementClass);
                if (!element) return;

                const values = $(el)
                    .find('.ak-title span')
                    .map((_, span) =>
                    Number($(span).text().replace('%', '').trim())
                    )
                    .get();

                if (values.length < 2) return;

                const [mastery, resistance] = values;

                stats[`MAITRISE_${element}`] = mastery;
                stats[`RESISTANCE_${element}`] = resistance;
            });

        return stats;
    }   

    private isCatchable($: CheerioAPI) {
        const isCatchable = $('.catchable strong').text().trim().toLowerCase();

        return isCatchable === 'oui';
    }
    
    private getDrops($: CheerioAPI) {
        const drops: any[] = [];

        $('.ak-panel')
            .filter((_, el) =>
            $(el).find('.ak-panel-title').text().includes('Drops')
            )
            .find('.ak-list-element')
            .each((_, el) => {
                const itemLink = $(el).find('.ak-image a').attr('href');
                if (!itemLink) return;

                const itemUrl = new URL(itemLink, process.env.BASE_URL).href;

                let { wakfuId, metaType } = this.parseItemUrl(itemLink);

                //If the type doesn't match it's set to empty string
                if (!isValidMetaType(metaType)) {
                    console.warn('[DROP] Type ignoré:', metaType, itemLink);
                    metaType = "";
                }

                const iconUrl = $(el).find('.ak-image img').attr('src') ?? null;

                const name = $(el)
                    .find('.ak-title span.ak-linker')
                    .text()
                    .trim();

                const rarityClass = $(el)
                    .find('.ak-icon-small[class*="ak-rarity-"]')
                    .attr('class') ?? '';  
                    
                const rarity = mapRarity(rarityClass);

                const dropRate = Number(
                    $(el)
                    .find('.ak-drop-percent span')
                    .last()
                    .text()
                    .replace('%', '')
                    .trim()
                );

                const level = Number(
                    $(el)
                    .find('.ak-aside')
                    .text()
                    .replace('Niv.', '')
                    .trim()
                );

                drops.push({
                    wakfuId,
                    metaType,
                    name,
                    level,
                    rarity,
                    dropRate,
                    quantity: 1,
                    iconPath: iconUrl,
                    itemUrl
                });
            });

        return drops;
    }

    private getSpells($: CheerioAPI) {
        const spells: string[] = [];

            $('.ak-panel:has(.ak-panel-title:contains("Sorts")) .ak-list-element .ak-title').each((_, el) => {
                const name = $(el).text().trim();
                if (name) {
                    spells.push(name);
                }
            });

            return spells;
    }

    private getHarvest($: CheerioAPI) {
        let harvests: HarvestItem[] = [];

        // Sélection du panel "Permet de recolter"
        $('.ak-panel:has(.ak-panel-title:contains("Permet de recolter")) .ak-list-element').each((_, el) => {
            const name = $(el).find('.ak-title .ak-linker').first().text().trim();

            const urlIcon = $(el).find('.ak-image img').attr('src')?.trim() || '';

            // Niveau affiché à droite (ak-aside)
            const level = $(el).find('.ak-aside').text().trim();

            // Niveau Trappeur dans ak-text (tres moche mais ca fonctionne)
            const trapperLevel = $(el).find('.ak-text span').text().trim().split("Niveau ")[1];

            if (name) {
                harvests.push({ name, urlIcon, level, trapperLevel });
            }
        });

        return harvests;
    }

    private mapElementFromClass(className: string): string | null {
        if (className.includes('ak-water')) return 'EAU';
        if (className.includes('ak-fire')) return 'FEU';
        if (className.includes('ak-earth')) return 'TERRE';
        if (className.includes('ak-air')) return 'AIR';
        return null;
    }

    private parseItemUrl(url: string): {
        wakfuId: number;
        metaType: string;
    } {
        // ex: /fr/mmorpg/encyclopedie/ressources/11528-peau-bouftou
        const parts = url.split('/').filter(Boolean);

        const metaType = parts[parts.length - 2].toUpperCase();
        const idPart = parts[parts.length - 1];

        const wakfuId = Number(idPart.split('-')[0]);

        return { wakfuId, metaType };
    }
}