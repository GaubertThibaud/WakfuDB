/*
  Warnings:

  - Made the column `url` on table `ListeItemsLinks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ListeItemsLinks" ALTER COLUMN "url" SET NOT NULL;
