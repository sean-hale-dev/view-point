-- DropForeignKey
ALTER TABLE "Alternate" DROP CONSTRAINT "Alternate_imageId_fkey";

-- AddForeignKey
ALTER TABLE "Alternate" ADD CONSTRAINT "Alternate_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
