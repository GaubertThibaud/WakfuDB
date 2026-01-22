-- CreateTable
CREATE TABLE "Spell" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterSpell" (
    "id" SERIAL NOT NULL,
    "monsterId" INTEGER NOT NULL,
    "spellId" INTEGER NOT NULL,
    "spellLevel" INTEGER,

    CONSTRAINT "MonsterSpell_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MonsterSpell" ADD CONSTRAINT "MonsterSpell_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterSpell" ADD CONSTRAINT "MonsterSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
