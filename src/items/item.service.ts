import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.item.findMany({
      orderBy: { level: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.item.findUnique({
      where: { id },
      include: {
        stats: { include: { stat: true } },
        monsterDrops: { include: { monster: true } },
        monsterHarvest: { include: { monster: true } },
      },
    });
  }

  findByWakfuId(wakfuId: number) {
    return this.prisma.item.findUnique({
      where: { wakfuId },
    });
  }

  create(dto: CreateItemDto) {
    return this.prisma.item.create({
      data: dto,
    });
  }

  update(id: number, dto: UpdateItemDto) {
    return this.prisma.item.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: number) {
    return this.prisma.item.delete({
      where: { id },
    });
  }

  async upsertByWakfuId(data: {
    name: string;
    wakfuId: number;
    level?: number;
    iconPath?: string;
    rarity: string;
    metaType: string;
    type: string;
    description?: string;
  }) {
    return this.prisma.item.upsert({
      where: { wakfuId: data.wakfuId },
      update: {
        wakfuId: data.wakfuId,
        level: data.level,
        iconPath: data.iconPath,
        rarity: data.rarity as any,
        metaType: data.metaType as any,
        type: data.type as any,
        description: data.description,
      },
      create: {
        name: data.name,
        wakfuId: data.wakfuId,
        level: data.level,
        iconPath: data.iconPath,
        rarity: data.rarity as any,
        metaType: data.metaType as any,
        type: data.type as any,
        description: data.description,
      },
    });
  }

}
