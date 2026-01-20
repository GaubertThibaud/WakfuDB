-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('INHABITUEL', 'RARE', 'EPIQUE', 'RELIQUE', 'SOUVENIR', 'LEGENDAIRE', 'MYTHIQUE');

-- CreateEnum
CREATE TYPE "MetaType" AS ENUM ('MONSTRES', 'ARMURES', 'ARMES', 'FAMILIERS', 'PERSONNALISATION', 'ACCESSOIRES', 'CONSOMMABLE', 'RESSOURCES', 'MONTURES', 'DIVERS');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('CASQUE', 'AMULETTE', 'PLASTRON', 'ANNEAU', 'BOTTES', 'CAPE', 'EPAULETTES', 'CEINTURE', 'ARME_1_MAIN', 'ARME_2_MAINS', 'SECONDE_MAIN', 'FAMILIER', 'ACCESSOIRE', 'EMBLEME', 'AMELIORATION', 'FRAGMENT', 'KAMAS', 'RECETTE', 'RESSOURCE', 'RESSOURCE_MONSTRE', 'SIOUPIERE_GLOU', 'TRANSMUTATION', 'ENCHANTEMENT', 'PARCHEMIN_SUBLIMATION', 'ANIMATION', 'COSTUME', 'TITRE', 'TRANSFORMATION', 'ARTIFICE', 'ATTITUDE', 'MONTURE', 'CONSOMMABLE', 'NOURRITURE');

-- CreateTable
CREATE TABLE "Stat" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "wakfuId" INTEGER,
    "name" TEXT NOT NULL,
    "level" INTEGER,
    "iconPath" TEXT,
    "rarity" "Rarity" NOT NULL,
    "metaType" "MetaType" NOT NULL,
    "type" "ItemType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemStat" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "ItemStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterFamily" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MonsterFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" SERIAL NOT NULL,
    "wakfuId" INTEGER,
    "name" TEXT NOT NULL,
    "iconPath" TEXT,
    "levelMin" INTEGER,
    "levelMax" INTEGER,
    "capturable" BOOLEAN NOT NULL DEFAULT false,
    "familyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterStat" (
    "id" SERIAL NOT NULL,
    "monsterId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "MonsterStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterDrop" (
    "id" SERIAL NOT NULL,
    "monsterId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "dropRate" DOUBLE PRECISION,
    "minQty" INTEGER DEFAULT 1,
    "maxQty" INTEGER DEFAULT 1,

    CONSTRAINT "MonsterDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterHarvest" (
    "id" SERIAL NOT NULL,
    "monsterId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "MonsterHarvest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stat_code_key" ON "Stat"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Item_wakfuId_key" ON "Item"("wakfuId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemStat_itemId_statId_key" ON "ItemStat"("itemId", "statId");

-- CreateIndex
CREATE UNIQUE INDEX "MonsterFamily_name_key" ON "MonsterFamily"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Monster_wakfuId_key" ON "Monster"("wakfuId");

-- CreateIndex
CREATE UNIQUE INDEX "MonsterStat_monsterId_statId_key" ON "MonsterStat"("monsterId", "statId");

-- CreateIndex
CREATE UNIQUE INDEX "MonsterDrop_monsterId_itemId_key" ON "MonsterDrop"("monsterId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "MonsterHarvest_monsterId_itemId_key" ON "MonsterHarvest"("monsterId", "itemId");

-- AddForeignKey
ALTER TABLE "ItemStat" ADD CONSTRAINT "ItemStat_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemStat" ADD CONSTRAINT "ItemStat_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monster" ADD CONSTRAINT "Monster_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "MonsterFamily"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterStat" ADD CONSTRAINT "MonsterStat_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterStat" ADD CONSTRAINT "MonsterStat_statId_fkey" FOREIGN KEY ("statId") REFERENCES "Stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterDrop" ADD CONSTRAINT "MonsterDrop_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterDrop" ADD CONSTRAINT "MonsterDrop_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterHarvest" ADD CONSTRAINT "MonsterHarvest_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterHarvest" ADD CONSTRAINT "MonsterHarvest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
