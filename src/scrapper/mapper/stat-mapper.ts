import { Stat } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { StatService } from "src/stats/stats.service";

export class MapperStats {
    private readonly statsService: StatService;
    public readonly listStats: Stat[];
    private readonly labelToCode = new Map<string, string>();
    private readonly codeSet = new Set<string>();

    private constructor(statsService: StatService, listStats: Stat[]) {
        this.statsService = statsService;
        this.listStats = listStats;

        for (const stat of listStats) {
            this.labelToCode.set(this.normalize(stat.label), stat.code);
            this.codeSet.add(this.normalize(stat.code));
        }
    }

    public static async create(): Promise<MapperStats> {
        const statsService = new StatService(new PrismaService());
        const listStats = await statsService.findAll();

        return new MapperStats(statsService, listStats);
    }

    public mapStatKey(value: string): string | null {
        const normalized = this.normalize(value);

        if (normalized === "points d'action") {
            return "PA"
        }

        if (this.codeSet.has(normalized)) {
            return value.toUpperCase();
        }

        const key = this.labelToCode.get(normalized);
        if (key) {
            return key;
        }

        console.warn(`[STAT UNKNOWN] "${value}"`);
        return null;
    }

    private normalize(value: string): string {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }
}