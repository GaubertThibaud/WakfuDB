import { PrismaService } from 'src/prisma/prisma.service';

export class SpellService {
  constructor(private readonly prisma: PrismaService) {}

  // Créer un nouveau sort
  async create(name: string) {
    return this.prisma.spell.create({
      data: { name },
    });
  }

  // Récupérer un sort par son ID
  async findById(id: number) {
    return this.prisma.spell.findUnique({
      where: { id },
      include: { monsters: true }, // Inclut les relations MonsterSpell
    });
  }

  // Récupérer tous les sorts
  async findAll() {
    return this.prisma.spell.findMany({
      include: { monsters: true },
    });
  }

  // Mettre à jour un sort
  async update(id: number, name: string) {
    return this.prisma.spell.update({
      where: { id },
      data: { name },
    });
  }

  // Supprimer un sort
  async delete(id: number) {
    return this.prisma.spell.delete({
      where: { id },
    });
  }

  async upsert(name: string) {
    return this.prisma.spell.upsert({
        where: {
            name: name, // cherche un sort avec ce nom
        },
        update: { name }, // si trouvé, met à jour le nom (optionnel ici)
        create: { name }, // si pas trouvé, crée le sort
    });
  }
}
