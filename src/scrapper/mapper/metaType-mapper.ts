import { ItemType, MetaType } from "@prisma/client";

const typeToMetaTypeMap: Record<ItemType | "MONSTRES", MetaType> = {
  CASQUE: 'ARMURES',
  AMULETTE: 'ARMURES',
  PLASTRON: 'ARMURES',
  ANNEAU: 'ARMURES',
  BOTTES: 'ARMURES',
  CAPE: 'ARMURES',
  EPAULETTES: 'ARMURES',
  CEINTURE: 'ARMURES',

  ARME_1_MAIN: 'ARMES',
  ARME_2_MAINS: 'ARMES',
  SECONDE_MAIN: 'ARMES',

  FAMILIER: 'FAMILIERS',
  ACCESSOIRE: 'ACCESSOIRES',
  EMBLEME: 'ACCESSOIRES',

  AMELIORATION: 'RESSOURCES',
  FRAGMENT: 'RESSOURCES',
  KAMAS: 'RESSOURCES',
  RECETTE: 'RESSOURCES',
  RESSOURCE: 'RESSOURCES',
  RESSOURCE_MONSTRE: 'RESSOURCES',
  SIOUPIERE_GLOU: 'RESSOURCES',
  TRANSMUTATION: 'RESSOURCES',
  ENCHANTEMENT: 'RESSOURCES',
  PARCHEMIN_SUBLIMATION: 'RESSOURCES',

  ANIMATION: 'PERSONNALISATION',
  COSTUME: 'PERSONNALISATION',
  TITRE: 'PERSONNALISATION',
  TRANSFORMATION: 'PERSONNALISATION',
  ARTIFICE: 'PERSONNALISATION',
  ATTITUDE: 'PERSONNALISATION',
  AURA: 'PERSONNALISATION',

  MONTURE: 'MONTURES',

  CONSOMMABLE: 'CONSOMMABLE',
  NOURRITURE: 'CONSOMMABLE',

  LIVRE: 'DIVERS',
  POCHETTE: 'DIVERS',
  CLEF: 'DIVERS',

  MONSTRES: "MONSTRES",
  TBD: "DIVERS",
};

export function getMetaTypeFromType(itemType: ItemType): MetaType | null {
  return typeToMetaTypeMap[itemType] || null;
}

export function isValidMetaType(value: string): value is MetaType {
  return Object.values(MetaType).includes(value as MetaType);
}

export function getTypesFromMetaType(metaType: string): ItemType[] {
  return Object.entries(typeToMetaTypeMap)
    .filter(([, mType]) => mType === metaType)
    .map(([type]) => type as ItemType)
}