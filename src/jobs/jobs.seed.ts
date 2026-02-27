import { PrismaClient } from '@prisma/client'
import { JOBS } from './jobs.data'

const prisma = new PrismaClient()

export async function seedJobs() {
  for (const job of JOBS) {
    await prisma.job.upsert({
      where: { name: job.name },
      update: {
        description: job.description
      },
      create: job
    })
  }

  console.log(`> ${JOBS.length} JOBS seedées`)
}
