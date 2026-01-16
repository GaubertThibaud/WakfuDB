export const CATEGORIES_FR = [
    "armures",
    "armes",
    "personnalisation",
    "accessoires",
    "consommables",
    "ressources",
    "montures",
    "divers",
] as const;

export type CategoryFR = typeof CATEGORIES_FR[number];
