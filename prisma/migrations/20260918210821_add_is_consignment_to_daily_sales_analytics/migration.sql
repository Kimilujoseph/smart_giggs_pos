/*
  Warnings:

  - A unique constraint covering the columns `[date,categoryId,shopId,sellerId,financeId,financeStatus,isConsignment]` on the table `DailySalesAnalytics` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `idx_unique_daily_sale` ON `dailysalesanalytics`;

-- AlterTable
ALTER TABLE `dailysalesanalytics` ADD COLUMN `isConsignment` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `idx_unique_daily_sale` ON `DailySalesAnalytics`(`date`, `categoryId`, `shopId`, `sellerId`, `financeId`, `financeStatus`, `isConsignment`);
