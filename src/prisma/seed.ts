import { seedStats } from './seed/stats.seed'

// Start the seeder
async function main() {
  await seedStats()
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