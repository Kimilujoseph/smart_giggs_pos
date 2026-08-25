/*
  Warnings:

  - A unique constraint covering the columns `[CategoryId,batchNumber]` on the table `accessories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `accessories` ADD COLUMN `soldUnits` INTEGER UNSIGNED NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `accessories_CategoryId_batchNumber_key` ON `accessories`(`CategoryId`, `batchNumber`);
