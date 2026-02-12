-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('FEU', 'EAU', 'AIR', 'TERRE', 'LUMIERE');

-- CreateTable
CREATE TABLE "WeaponDamage" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "element" "ElementType" NOT NULL,
    "min" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "isCrit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeaponDamage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WeaponDamage" ADD CONSTRAINT "WeaponDamage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
