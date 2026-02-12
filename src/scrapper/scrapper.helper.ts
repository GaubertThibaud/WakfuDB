import { CheerioAPI } from "cheerio";
import { mapRarity } from "./mapper/rarity-mapper";

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