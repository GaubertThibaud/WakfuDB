import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { ItemStatService } from './item-stats/item-stat.service';

@Module({
  imports: [PrismaModule],
  controllers: [ItemController],
  providers: [ItemService, ItemStatService],
  exports: [ItemService],
})
export class ItemsModule {}