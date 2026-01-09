-- CreateTable
CREATE TABLE `DailySalesAnalytics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NULL,
    `categoryId` INTEGER NOT NULL,
    `shopId` INTEGER NOT NULL,
    `sellerId` INTEGER NOT NULL,
    `financeId` INTEGER NULL,
    `financeStatus` VARCHAR(50) NULL,
    `totalUnitsSold` INTEGER NULL,
    `totalRevenue` DECIMAL(18, 2) NULL,
    `totalCostOfGoods` DECIMAL(12, 2) NOT NULL,
    `grossProfit` DECIMAL(18, 2) NULL,
    `totalCommission` DECIMAL(18, 2) NULL,
    `totalfinanceAmount` DECIMAL(18, 2) NULL,

    INDEX `idx_categoryId`(`categoryId`),
    INDEX `idx_date`(`date`),
    INDEX `idx_sellerId`(`sellerId`),
    INDEX `idx_shopId`(`shopId`),
    UNIQUE INDEX `idx_unique_daily_sale`(`date`, `categoryId`, `shopId`, `sellerId`, `financeId`, `financeStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
