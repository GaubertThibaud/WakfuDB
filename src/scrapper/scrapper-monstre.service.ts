import { ListeItemsLinks } from "generated/prisma";
import { ScrapperService } from "./scrapper.service";
import { CFDecision } from "./metricsAnalyse";
import { CheerioAPI } from "cheerio";
import { mapRarity } from "./mapper/rarity-mapper";
import { isValidMetaType } from "./mapper/metaType-mapper";
import { MapperStats } from "./mapper/stat-mapper";
import { MonsterFamilyService } from "src/monster/monster-family/monster-family.service";
import { PrismaService } from "../prisma/prisma.service";
import { MonsterService } from "src/monster/monster.service";
import { MonsterStatService } from "src/monster/monster-stat/monster-stat.service";
import { MonsterSpellService } from "src/monster/monster-spell.service.ts/monster-spell.service";
import { SpellService } from "src/spells/spell.service";
import { ItemService } from "src/items/item.service";
import { ItemType, MetaType, MonsterFamily, Rarity } from "@prisma/client";
import { MonsterDropService } from "src/monster/monster-drop/monster-drop.service";
import { MonsterHarvestService } from "src/monster/monster-harvest/monster-harvest.service";

interface HarvestItem {
    name: string;
    urlIcon: string;
    level: number;
    trapperLevel: number; 
}

interface Drop {
    wakfuId: number,
    metaType: MetaType,
    name: string,
    level: number,
    rarity: Rarity,
    dropRate: number,
    quantity: number,
    iconPath: string,
    itemUrl: string,
}

interface Monster {
    name: string;
    familly: string;
    urlIcon: string | null;
    lvlMax: number | null;
    lvlMin: number | null;
    stats: {
        [x: string]: number;
    };
    catchable: boolean;
    drops: Drop[];
    spells: string[];
    harvest: HarvestItem[];
    wakfuId: number;
}

export class ScrapperMonsterService {
    private scrapperService: ScrapperService;
    private mapperStat: MapperStats;
    private prismaService: PrismaService;
    private monsterFamilyService: MonsterFamilyService;
    private monsterService: MonsterService;
    private monsterStatService: MonsterStatService;
    private monsterSpellService: MonsterSpellService;
    private spellService: SpellService;
    private itemService: ItemService;
    private monsterDropService: MonsterDropService;
    private monsterHarvestService: MonsterHarvestService;

    private constructor(scrapperService: ScrapperService, mapperStat: MapperStats) {
        this.scrapperService = scrapperService
        this.mapperStat = mapperStat
        this.prismaService = new PrismaService();
        this.monsterFamilyService = new MonsterFamilyService(this.prismaService);
        this.monsterService = new MonsterService(this.prismaService);
        this.monsterStatService = new MonsterStatService(this.prismaService);
        this.monsterSpellService = new MonsterSpellService(this.prismaService);
        this.spellService = new SpellService(this.prismaService);
        this.itemService = new ItemService(this.prismaService);
        this.monsterDropService = new MonsterDropService(this.prismaService);
        this.monsterHarvestService = new MonsterHarvestService(this.prismaService);
    }

    public static async create() {
        const scrapperService = new ScrapperService();
        const mapperStat = await MapperStats.create();

        return new ScrapperMonsterService(scrapperService, mapperStat);
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

            if(!urlCategory.nameFr) {
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
            const wakfuId = this.getWakfuId(urlCategory.url);

            if (!wakfuId) {
                throw new Error("Something went wrong while parsine the monster WakfuId");
            }

            const monster: Monster = {
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
                wakfuId: wakfuId,
            }

            const newMonster = await this.insertNewMonster(monster);

        }
    }

    private async insertNewMonster(monster: Monster) {
        let monsterFamilyId: number | undefined;

        if(monster.familly){
            const monsterFamily = await this.monsterFamilyService.findOrCreate(monster.familly);
            monsterFamilyId = monsterFamily.id;
        }
        
        const newMonster = await this.monsterService.upsertByName({
            wakfuId: monster.wakfuId,
            name: monster.name,
            iconPath: monster.urlIcon || undefined,
            levelMax: monster.lvlMax || undefined,
            levelMin: monster.lvlMin || undefined,
            capturable: monster.catchable,
            familyId: monsterFamilyId
        });

        Object.entries(monster.stats).forEach(([statName, statValue]) => {
            const listStats = this.mapperStat.listStats;
            const stat = listStats.find(s => s.code === statName || s.label === statName);

            if (stat) {
                this.monsterStatService.setStat(newMonster.id, stat.id, statValue);
            } else {
                console.warn(`Stat inconnue: ${statName}`);
            }
        });

        for (const spell in monster.spells) {
            const newSpell = await this.spellService.upsert(spell);

            this.monsterSpellService.addSpellToMonster({
                monsterId: newMonster.id,
                spellId: newSpell.id,
                spellLevel: 200
            })
        };

        for (const drop of monster.drops) {
            //There are edge case where they have blanc items
            if (!drop.name) {
                continue;
            }
            
            let metaType: MetaType = MetaType.DIVERS;
            if(drop.metaType) {
                metaType = drop.metaType;
            }
            const item = await this.itemService.upsertByName({
                wakfuId: drop.wakfuId,
                name: drop.name,
                level: drop.level,
                iconPath: drop.iconPath,
                rarity: drop.rarity,
                metaType: metaType,
                type: ItemType.TBD,
                description: undefined,
            })

            await this.monsterDropService.upsertDrop(newMonster.id, item.id, drop.dropRate, drop.quantity);
        }

        for (const harvest of monster.harvest) {
            const wakfuId = this.getWakfuId(harvest.urlIcon);

            const item = await this.itemService.upsertByName({
                wakfuId: wakfuId || undefined,
                name: harvest.name,
                level: harvest.level,
                iconPath: harvest.urlIcon,
                rarity: Rarity.COMMUN,
                metaType: MetaType.RESSOURCES,
                type: ItemType.TBD,
                description: undefined,
            })

            await this.monsterHarvestService.addHarvest(newMonster.id, item.id);
        }

        return newMonster;
    }   


    private getWakfuId(url: string): number | null {
        const match = url.match(/\/(\d+)-/);
        //returning ID as 0 if there aren't any but should never happen but easy flag in the DB
        return match ? Number(match[1]) : null;
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

    private getLvl($: CheerioAPI): {
        lvlMin: number | null;
        lvlMax: number | null;
    } {
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
    
    private getStats($: CheerioAPI): Record<string, number> {
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
                    .filter((_, span) => $(span).text().includes('%'))
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
            const level = Number($(el).find('.ak-aside').text().trim().split("Niv. ")[1]);

            // Niveau Trappeur dans ak-text (tres moche mais ca fonctionne)
            const trapperLevel = Number($(el).find('.ak-text span').text().trim().split("Niveau ")[1]);

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