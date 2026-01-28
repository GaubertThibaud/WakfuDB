import { Rarity, MetaType, ItemType } from '@prisma/client';

export class CreateItemDto {
  wakfuId?: number;
  name: string;
  level?: number;
  iconPath?: string;

  rarity: Rarity;
  metaType: MetaType;
  type: ItemType;

  description?: string;
}
