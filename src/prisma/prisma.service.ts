import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: ['query', 'error', 'warn'], // pour debug SQL
            errorFormat: 'pretty'
        });
    }
    
        async onModuleInit() {
        await this.$connect();
        console.log('Prisma connected to PostgreSQL');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    //Because I forgot to put @unique for the url field ! 
    //Select url, COUNT(*) FROM "ListeItemsLinks" GROUP BY url HAVING COUNT(*) > 1;
    async sanitizeDB() {
        const duplicates = await this.listeItemsLinks.groupBy({
            by: ['url'],
            _count: { url: true },
            having: {
            url: {
                _count: { gt: 1 },
            },
            },
        })

        const idsToDelete: number[] = []

        for (const dup of duplicates) {
            const rows = await this.listeItemsLinks.findMany({
            where: { url: dup.url },
            orderBy: { id: 'asc' },
            select: { id: true },
            })

            idsToDelete.push(...rows.slice(1).map(r => r.id))
        }

        if (idsToDelete.length) {
            await this.listeItemsLinks.deleteMany({
            where: { id: { in: idsToDelete } },
            })
        }

        return idsToDelete;
    }
}