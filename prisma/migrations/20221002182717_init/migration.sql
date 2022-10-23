-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ARTIST', 'CHARACTER');

-- CreateEnum
CREATE TYPE "SocialType" AS ENUM ('FURAFFINITY', 'TELEGRAM', 'TWITTER', 'WEBSITE', 'CUSTOM');

-- CreateTable
CREATE TABLE "Commission" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "dateCommissioned" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReceived" TIMESTAMP(3),
    "invoiceId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "nsfw" BOOLEAN NOT NULL,
    "artistId" INTEGER NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Social" (
    "id" SERIAL NOT NULL,
    "type" "SocialType" NOT NULL,
    "value" TEXT NOT NULL,
    "name" TEXT,
    "entityId" INTEGER NOT NULL,

    CONSTRAINT "Social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "bucketId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternate" (
    "id" SERIAL NOT NULL,
    "bucketId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "imageId" INTEGER NOT NULL,
    "userProvided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Alternate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "placeholderURI" TEXT NOT NULL,
    "thumbnailForCommissionID" INTEGER,
    "belongsToCommissionID" INTEGER,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_characters" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_invoiceId_key" ON "Commission"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Image_thumbnailForCommissionID_key" ON "Image"("thumbnailForCommissionID");

-- CreateIndex
CREATE UNIQUE INDEX "_characters_AB_unique" ON "_characters"("A", "B");

-- CreateIndex
CREATE INDEX "_characters_B_index" ON "_characters"("B");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social" ADD CONSTRAINT "Social_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternate" ADD CONSTRAINT "Alternate_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_thumbnailForCommissionID_fkey" FOREIGN KEY ("thumbnailForCommissionID") REFERENCES "Commission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_belongsToCommissionID_fkey" FOREIGN KEY ("belongsToCommissionID") REFERENCES "Commission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_characters" ADD CONSTRAINT "_characters_A_fkey" FOREIGN KEY ("A") REFERENCES "Commission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_characters" ADD CONSTRAINT "_characters_B_fkey" FOREIGN KEY ("B") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
