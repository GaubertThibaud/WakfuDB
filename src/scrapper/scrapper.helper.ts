import { CheerioAPI } from "cheerio";
import { mapRarity } from "./mapper/rarity-mapper";
import { MapperJob } from "./mapper/job-mapper";
import { MetaType } from "@prisma/client";
import { isValidMetaType } from "./mapper/metaType-mapper";

interface DropSource {
  name: string;
  wakfuId: number;
  dropRate: number;
}

export function getWakfuId(url: string): number | null {
    const match = url.match(/\/(\d+)-/);
    //returning ID as 0 if there aren't any but should never happen but easy flag in the DB
    return match ? Number(match[1]) : null;
}

export function getLvl($: CheerioAPI): {
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

export function getUrlIcon($: CheerioAPI) {
    const img = $('.ak-encyclo-detail-illu img');

    const imageUrl = img.attr('data-src') || img.attr('src') || null;
    const image = imageUrl
    ? new URL(imageUrl, 'https://static.ankama.com').href
    : null;

    return image;
}

export function getType($: CheerioAPI) {
    return $('.ak-encyclo-detail-type span')
        .first()
        .text()
        .trim();
}

export function getRarete($: CheerioAPI) { 
    const rarityClass = $('.ak-object-rarity span span')
        .attr('class')
        ?.split(' ')
        .find(c => c.startsWith('ak-rarity-'));
    return mapRarity(rarityClass || "ak-rarity-99");
}

export function getDescription($: CheerioAPI) { 
    return $('.ak-panel')
        .filter((_, el) =>
            $(el).find('.ak-panel-title').text().trim() === 'Description'
        )
        .find('.ak-panel-content')
        .text()
        .replace(/\s+/g, ' ')
        .trim();
}

export function getDropFrom($: CheerioAPI): DropSource[] {
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

export function getRecipesFor($: CheerioAPI, mapperJob: MapperJob) {
  const recipes: {
    jobName: string;
    jobLevel: number;
    itemName: string;
    wakfuId: number;
    metaType: string;
  }[] = [];

  const recipePanel = $('.ak-panel-title')
    .filter((_, el) =>
      $(el).text().replace(/\s+/g, ' ').trim() === 'est utilisé pour les recettes'
    )
    .closest('.ak-panel');

  recipePanel.find('.ak-list-element').each((_, el) => {
    const itemAnchor = $(el).find('.ak-title a');

    // Nom item (sans script)
    const itemName = itemAnchor
      .find('.ak-linker')
      .first()
      .text()
      .trim();

    // Href pour ID + metaType
    const href = itemAnchor.attr('href');

    let wakfuId: number | null = null;
    let metaType: string | null = null;

    if (href) {
      const match = href.match(/encyclopedie\/([^/]+)\/(\d+)-/);
      if (match) {
        metaType = match[1];      // armes
        wakfuId = Number(match[2]); // 32479
      }
    }

    // Métier + niveau
    const jobText = $(el)
      .find('.ak-text')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    const jobMatch = jobText.match(/(.+?)\s*-\s*Niveau\s*(\d+)/i);

    let jobName = '';
    let jobLevel = 0;

    if (jobMatch) {
      const normalizedJobName = mapperJob.mapJob(jobMatch[1].trim());
      if (normalizedJobName) {
        jobName = normalizedJobName.name;
      }
      jobLevel = Number(jobMatch[2]);
    }

    if (itemName && wakfuId && metaType && jobName) {
      recipes.push({
        jobName: jobName.toLowerCase(),
        jobLevel,
        itemName,
        wakfuId,
        metaType: metaType.toLowerCase(),
      });
    }
  });

  return recipes;
}

export function getRecipesFrom($: CheerioAPI, mapperJob: MapperJob) {
    const result: {
        job: string;
        jobLvl: number;
        recipe: {
        quantity: number;
        wakfuID: number;
        nom: string;
        metaType: string;
        urlIcon: string;
        }[];
    } | null = null;

    // Panel "Recette"
    const recipePanel = $('.ak-panel-title')
        .filter((_, el) =>
        $(el).text().replace(/\s+/g, ' ').trim() === 'Recette'
        )
        .closest('.ak-panel');

    if (!recipePanel.length) return null;

    // Job + level
    const introText = recipePanel
        .find('.ak-panel-intro')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();

    // Exemple : "Maitre d'Armes - Niveau 160"
    const jobMatch = introText.match(/(.+?)\s*-\s*Niveau\s*(\d+)/i);

    if (!jobMatch) return null;

    const mappedJob = mapperJob.mapJob(jobMatch[1].trim());
    const jobName = mappedJob ? mappedJob.name.toLowerCase() : '';
    const jobLvl = Number(jobMatch[2]);

    if (!jobName) return null;

    const recipe: {
        quantity: number;
        wakfuID: number;
        nom: string;
        metaType: string;
        urlIcon: string;
    }[] = [];

    recipePanel.find('.ak-list-element').each((_, el) => {
        const element = $(el);

        // Quantité
        const quantityText = element
        .find('.ak-front')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

        const quantityMatch = quantityText.match(/(\d+)/);
        const quantity = quantityMatch ? Number(quantityMatch[1]) : 0;

        const anchor = element.find('.ak-title a').first();
        const href = anchor.attr('href');

        if (!href) return;

        // WakfuID
        const idMatch = href.match(/encyclopedie\/.*?(\d+)-/);
        if (!idMatch) return;

        const wakfuID = Number(idMatch[1]);
        if (!wakfuID) return;

        // Nom
        const nom = anchor
        .find('.ak-linker')
        .first()
        .text()
        .trim();

        if (!nom) return;

        // Type affiché (fiable)
        const type = element
        .find('.ak-text')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

        // MetaType dérivé du href si possible
        let metaType = "TBD";
        const metaMatch = href.match(/encyclopedie\/([^/]+)\//);
        if (metaMatch) {
            metaType = metaMatch[1].toUpperCase();
        }
        console.log(metaType);

        if(!isValidMetaType(metaType)) {
            metaType = "TBD";
        }

        // Icon
        const urlIcon =
        element.find('.ak-image img').attr('src') ?? '';

        console.log(quantity, wakfuID, metaType, nom )


        if (quantity && wakfuID && nom) {
        recipe.push({
            quantity,
            wakfuID,
            nom,
            metaType,
            urlIcon,
        });
        }
    });

    return {
        job: jobName,
        jobLvl,
        recipe,
    };
}