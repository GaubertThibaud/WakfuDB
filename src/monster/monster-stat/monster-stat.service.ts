import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MonsterStatService {
  constructor(private prisma: PrismaService) {}

  setStat(monsterId: number, statId: number, value: number) {
    return this.prisma.monsterStat.upsert({
      where: {
        monsterId_statId: { monsterId, statId },
      },
      update: { value },
      create: { monsterId, statId, value },
    });
  }
}
