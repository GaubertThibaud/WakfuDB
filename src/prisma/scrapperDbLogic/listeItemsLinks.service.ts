import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ListeItemsLinks {
    constructor(private prisma: PrismaService) {}

    public async createListeItemsLinks(data: {
        nameFr?: string,
        nameEn?: string,
        nameEs?: string,
        url?: string,
        type?: string
    }) {
        return this.prisma.listeItemsLinks.create({
            data,
        });
    }
}