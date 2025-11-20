-- CreateTable
CREATE TABLE `SellerPerformanceKPI` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` INTEGER NOT NULL,
    `financerId` INTEGER NULL,
    `categoryId` INTEGER NOT NULL,
    `calculationDate` DATE NOT NULL,
    `period` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    `totalSalesRevenue` DECIMAL(18, 2) NOT NULL,
    `totalUnitsSold` INTEGER NOT NULL,
    `averageDealSize` DECIMAL(18, 2) NOT NULL,
    `totalGrossProfit` DECIMAL(18, 2) NOT NULL,
    `profitMargin` DECIMAL(5, 2) NOT NULL,
    `returnRate` DECIMAL(5, 2) NOT NULL,
    `totalCommissionPaid` DECIMAL(18, 2) NOT NULL,
    `commissionAsPercentageOfSales` DECIMAL(5, 2) NOT NULL,

    INDEX `SellerPerformanceKPI_sellerId_idx`(`sellerId`),
    INDEX `SellerPerformanceKPI_financerId_idx`(`financerId`),
    INDEX `SellerPerformanceKPI_categoryId_idx`(`categoryId`),
    INDEX `SellerPerformanceKPI_calculationDate_idx`(`calculationDate`),
    UNIQUE INDEX `SellerPerformanceKPI_sellerId_financerId_categoryId_calculat_key`(`sellerId`, `financerId`, `categoryId`, `calculationDate`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SellerPerformanceKPI` ADD CONSTRAINT `SellerPerformanceKPI_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `actors`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerPerformanceKPI` ADD CONSTRAINT `SellerPerformanceKPI_financerId_fkey` FOREIGN KEY (`financerId`) REFERENCES `Financer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerPerformanceKPI` ADD CONSTRAINT `SellerPerformanceKPI_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
