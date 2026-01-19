/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `ListeItemsLinks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ListeItemsLinks_url_key" ON "ListeItemsLinks"("url");
