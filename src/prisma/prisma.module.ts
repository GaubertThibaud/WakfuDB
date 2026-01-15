// prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Rend le service disponible partout sans ré-importer le module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}