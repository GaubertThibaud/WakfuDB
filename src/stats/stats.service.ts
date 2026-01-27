import { Injectable } from "@nestjs/common";
import { Stat } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class StatService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(): Promise<Stat[]> {
        return this.prisma.stat.findMany({
            orderBy: { code: 'asc' },
        });
    }

    findById(id: number): Promise<Stat | null> {
        return this.prisma.stat.findUnique({
            where: { id },
        });
    } 

    findByCode(code: string): Promise<Stat | null> {
        return this.prisma.stat.findUnique({
            where: { code },
        });
    }

    create(code: string, label: string): Promise<Stat> {
        return this.prisma.stat.create({
            data: { code, label },
        });
    }

    async findOrCreate(
        code: string,
        label?: string,
    ): Promise<Stat> {
        const existing = await this.findByCode(code);
        if (existing) return existing;

        return this.prisma.stat.create({
            data: {
                code,
                label: label ?? code,
            },
        });
    }

    normalizeCode(raw: string): string {
        return raw
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
    }

    async resolveFromScraping(
            rawLabel: string,
        ): Promise<Stat> {
            const code = this.normalizeCode(rawLabel);
            return this.findOrCreate(code, rawLabel);
        }

        async assertStatsExist(statCodes: string[]): Promise<void> {
        const existing = await this.prisma.stat.findMany({
            where: {
                code: { in: statCodes },
            },
            select: { code: true },
        });

        const existingCodes = new Set(existing.map(s => s.code));
        const missing = statCodes.filter(c => !existingCodes.has(c));

        if (missing.length > 0) {
            throw new Error(
                `Stats inconnues : ${missing.join(', ')}`,
            );
        }
    }
}