import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { MonsterService } from './monster.service';
import { CreateMonsterDto } from './dto/create-monster.dto';
import { UpdateMonsterDto } from './dto/update-monster.dto';

@Controller('monsters')
export class MonsterController {
  constructor(private readonly monsterService: MonsterService) {}

  @Post()
  create(@Body() dto: CreateMonsterDto) {
    return this.monsterService.create(dto);
  }

  @Get()
  findAll() {
    return this.monsterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monsterService.findById(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMonsterDto) {
    return this.monsterService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monsterService.delete(+id);
  }
}
