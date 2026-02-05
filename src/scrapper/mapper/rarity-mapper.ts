import { Rarity } from "@prisma/client";

export function mapRarity(className: string): Rarity {
    if (className.includes('ak-rarity-0')) return Rarity.COMMUN;
    if (className.includes('ak-rarity-1')) return Rarity.INHABITUEL;
    if (className.includes('ak-rarity-2')) return Rarity.RARE;
    if (className.includes('ak-rarity-3')) return Rarity.MYTHIQUE;
    if (className.includes('ak-rarity-4')) return Rarity.LEGENDAIRE;
    if (className.includes('ak-rarity-5')) return Rarity.RELIQUE;
    if (className.includes('ak-rarity-6')) return Rarity.SOUVENIR;
    if (className.includes('ak-rarity-7')) return Rarity.EPIQUE;

    return Rarity.COMMUN;
}