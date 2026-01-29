import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMonsterDto } from './dto/create-monster.dto';
import { UpdateMonsterDto } from './dto/update-monster.dto';

@Injectable()
export class MonsterService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMonsterDto) {
    return this.prisma.monster.create({
      data: {
        ...dto,
      },
    });
  }

  findAll() {
    return this.prisma.monster.findMany({
      include: {
        family: true,
      },
    });
  }

  findById(id: number) {
    return this.prisma.monster.findUnique({
      where: { id },
      include: {
        family: true,
        stats: { include: { stat: true } },
        drops: { include: { item: true } },
        harvest: { include: { item: true } },
        spell: { include: { spell: true } },
      },
    });
  }

  update(id: number, dto: UpdateMonsterDto) {
    return this.prisma.monster.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: number) {
    return this.prisma.monster.delete({
      where: { id },
    });
  }
}
