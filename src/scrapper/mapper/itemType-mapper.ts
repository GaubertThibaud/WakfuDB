import { ItemType } from "@prisma/client";

export function isValidItemType(value: string): value is ItemType {
  return Object.values(ItemType).includes(value as ItemType);
}