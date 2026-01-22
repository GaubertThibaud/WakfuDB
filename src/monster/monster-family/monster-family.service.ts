import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MonsterFamilyService {
  constructor(private prisma: PrismaService) {}

  findOrCreate(name: string) {
    return this.prisma.monsterFamily.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}
