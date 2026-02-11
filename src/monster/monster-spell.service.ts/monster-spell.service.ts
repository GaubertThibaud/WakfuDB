import { Injectable } from '@nestjs/common';
import { CreateMonsterSpellDto } from '../dto/create-monster-spell.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MonsterSpellService {
  constructor(private readonly prisma: PrismaService) {}

  // Ajouter un sort à un monstre
  async addSpellToMonster(data: CreateMonsterSpellDto) {
    return this.prisma.monsterSpell.upsert({
      where: {
        monsterId_spellId: {
          monsterId: data.monsterId,
          spellId: data.spellId,
        },
      },
      update: {
        spellLevel: data.spellLevel ?? 1,
      },
      create: {
        monsterId: data.monsterId,
        spellId: data.spellId,
        spellLevel: data.spellLevel ?? 1,
      },
    });
  }

  // Récupérer tous les sorts d'un monstre
  async getSpellsByMonster(monsterId: number) {
    return this.prisma.monsterSpell.findMany({
      where: { monsterId },
      include: { spell: true }, // jointure pour récupérer le sort complet
    });
  }

  // Mettre à jour le niveau d'un sort d'un monstre
  async updateSpellLevel(id: number, level: number) {
    return this.prisma.monsterSpell.update({
      where: { id },
      data: { spellLevel: level },
    });
  }

  // Supprimer un sort d'un monstre
  async removeSpellFromMonster(id: number) {
    return this.prisma.monsterSpell.delete({ where: { id } });
  }
}
