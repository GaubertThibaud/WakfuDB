import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MonsterService } from './monster.service';
import { MonsterController } from './monster.controller';
import { MonsterFamilyService } from './monster-family/monster-family.service';
import { MonsterStatService } from './monster-stat/monster-stat.service';
import { MonsterDropService } from './monster-drop/monster-drop.service';
import { MonsterHarvestService } from './monster-harvest/monster-harvest.service';

@Module({
  imports: [PrismaModule],
  controllers: [MonsterController],
  providers: [
    MonsterService,
    MonsterFamilyService,
    MonsterStatService,
    MonsterDropService,
    MonsterHarvestService,
  ],
  exports: [MonsterService],
})
export class MonstersModule {}
