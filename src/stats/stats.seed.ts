import { PrismaClient } from '@prisma/client'
import { STATS } from './stats.data'

const prisma = new PrismaClient()

export async function seedStats() {
  for (const stat of STATS) {
    await prisma.stat.upsert({
      where: { code: stat.code },
      update: {
        label: stat.label
      },
      create: stat
    })
  }

  console.log(`> ${STATS.length} stats seedées`)
}
