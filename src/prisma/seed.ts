import { seedJobs } from "../jobs/jobs.seed"
import { seedStats } from "../stats/stats.seed"

// Start the seeder
async function main() {
  await seedStats()
  await seedJobs()
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))

/*
How to run this : 
npx ts-node src/prisma/seed.ts
OR
npx prisma db seed 
*/