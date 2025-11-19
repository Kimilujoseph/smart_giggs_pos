/*
  Warnings:

  - You are about to drop the column `paymentId` on the `accessorysales` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `mobilesales` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `accessorysales` DROP FOREIGN KEY `accessorysales_paymentId_fkey`;

-- DropForeignKey
ALTER TABLE `mobilesales` DROP FOREIGN KEY `mobilesales_paymentId_fkey`;

-- DropIndex
DROP INDEX `accessorysales_paymentId_idx` ON `accessorysales`;

-- DropIndex
DROP INDEX `mobilesales_paymentId_idx` ON `mobilesales`;

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `accessorySaleId` INTEGER NULL,
    ADD COLUMN `mobileSaleId` INTEGER NULL;

-- AlterTable
ALTER TABLE `accessorysales` DROP COLUMN `paymentId`;

-- AlterTable
ALTER TABLE `mobilesales` DROP COLUMN `paymentId`;

-- CreateIndex
CREATE INDEX `Payment_mobileSaleId_idx` ON `Payment`(`mobileSaleId`);

-- CreateIndex
CREATE INDEX `Payment_accessorySaleId_idx` ON `Payment`(`accessorySaleId`);

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_mobileSaleId_fkey` FOREIGN KEY (`mobileSaleId`) REFERENCES `mobilesales`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_accessorySaleId_fkey` FOREIGN KEY (`accessorySaleId`) REFERENCES `accessorysales`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;
