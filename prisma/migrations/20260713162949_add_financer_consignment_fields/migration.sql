-- AlterTable
ALTER TABLE `mobiles` ADD COLUMN `financerId` INTEGER NULL,
    ADD COLUMN `isConsignment` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `margin` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateIndex
CREATE INDEX `mobiles_financerId_fkey` ON `mobiles`(`financerId`);

-- CreateIndex
CREATE INDEX `mobiles_isConsignment_fkey` ON `mobiles`(`isConsignment`);

-- AddForeignKey
ALTER TABLE `mobiles` ADD CONSTRAINT `mobiles_financerId_fkey` FOREIGN KEY (`financerId`) REFERENCES `Financer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
