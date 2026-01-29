import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ListeItemsLinksService {
    constructor(private prisma: PrismaService) {}

    public async createListeItemsLinks(data: {
        nameFr?: string,
        nameEn?: string,
        nameEs?: string,
        url: string,
        type?: string
    }) {
        return this.prisma.listeItemsLinks.create({
            data,
        });
    }

    public async getlisteItemsLinks(type: string) {
        return this.prisma.listeItemsLinks.findMany({
            where: {
                type: type
            }
        })
    }

    public async getlisteType() {
        return this.prisma.listeItemsLinks.groupBy({by: ['type']});
    }
}