/*
  Warnings:

  - A unique constraint covering the columns `[monsterId,spellId]` on the table `MonsterSpell` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MonsterSpell_monsterId_spellId_key" ON "MonsterSpell"("monsterId", "spellId");
