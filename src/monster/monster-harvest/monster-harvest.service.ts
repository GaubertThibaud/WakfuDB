import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MonsterHarvestService {
  constructor(private prisma: PrismaService) {}

  addHarvest(monsterId: number, itemId: number) {
    return this.prisma.monsterHarvest.upsert({
      where: {
        monsterId_itemId: { monsterId, itemId },
      },
      update: {},
      create: { monsterId, itemId },
    });
  }
}
