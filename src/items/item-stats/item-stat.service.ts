import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddItemStatDto } from './item-stat.dto';

@Injectable()
export class ItemStatService {
  constructor(private readonly prisma: PrismaService) {}

  addStatToItem(itemId: number, dto: AddItemStatDto) {
    return this.prisma.itemStat.upsert({
      where: {
        itemId_statId: {
          itemId,
          statId: dto.statId,
        },
      },
      update: {
        value: dto.value,
      },
      create: {
        itemId,
        statId: dto.statId,
        value: dto.value,
      },
    });
  }

  removeStatFromItem(itemId: number, statId: number) {
    return this.prisma.itemStat.delete({
      where: {
        itemId_statId: {
          itemId,
          statId,
        },
      },
    });
  }

  clearItemStats(itemId: number) {
    return this.prisma.itemStat.deleteMany({
      where: { itemId },
    });
  }
}
