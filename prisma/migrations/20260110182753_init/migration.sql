-- CreateTable
CREATE TABLE "ListeItemsLinks" (
    "id" SERIAL NOT NULL,
    "nameFr" TEXT,
    "url" TEXT,
    "type" TEXT,
    "nameEn" TEXT,
    "nameEs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListeItemsLinks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaveATScraping" (
    "id" SERIAL NOT NULL,
    "urlStopedAt" TEXT NOT NULL,
    "pageNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaveATScraping_pkey" PRIMARY KEY ("id")
);
