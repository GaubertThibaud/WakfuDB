import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MonsterDropService {
  constructor(private prisma: PrismaService) {}

  upsertDrop(monsterId: number, itemId: number, dropRate?: number, minQty = 1, maxQty = 1) {
    return this.prisma.monsterDrop.upsert({
      where: {
        monsterId_itemId: { monsterId, itemId },
      },
      update: { dropRate, minQty, maxQty },
      create: { monsterId, itemId, dropRate, minQty, maxQty },
    });
  }
}
