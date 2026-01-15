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

    async createListeItemsLinks(data: {
        nameFr?: string,
        nameEn?: string,
        nameEs?: string,
        url?: string,
        type?: string
    }) {
        return this.listeItemsLinks.create({
            data,
        });
    }

    async saveScrapingState(urlStopedAt: string, pageNumber?: number) {
        return this.saveATScraping.create({
            data: {
            urlStopedAt,
            pageNumber
            },
        });
    }

}