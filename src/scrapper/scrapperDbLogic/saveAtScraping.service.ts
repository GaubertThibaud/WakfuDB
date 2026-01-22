import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SaveATScraping {
    constructor(private prisma: PrismaService) {}

    public async saveScrapingState(urlStopedAt: string, pageNumber?: number) {
        return this.prisma.saveATScraping.create({
            data: {
            urlStopedAt,
            pageNumber
            },
        });
    }
}