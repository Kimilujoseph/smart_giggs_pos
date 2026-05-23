-- AlterTable
ALTER TABLE `Expense` ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedById` INTEGER NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `paymentMethod` ENUM('CASH', 'CARD', 'TRANSFER', 'MPESA', 'AIRTELMONEY') NULL,
    ADD COLUMN `reference` VARCHAR(255) NULL,
    ADD COLUMN `rejectionReason` VARCHAR(500) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `subcategory` VARCHAR(100) NULL,
    ADD COLUMN `taxAmount` DECIMAL(10, 2) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `vendorContact` VARCHAR(100) NULL,
    ADD COLUMN `vendorName` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `ExpenseAuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expenseId` INTEGER NOT NULL,
    `action` ENUM('CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'STATUS_CHANGED') NOT NULL,
    `changedById` INTEGER NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `reason` VARCHAR(500) NULL,

    INDEX `ExpenseAuditLog_expenseId_idx`(`expenseId`),
    INDEX `ExpenseAuditLog_changedById_idx`(`changedById`),
    INDEX `ExpenseAuditLog_action_idx`(`action`),
    INDEX `ExpenseAuditLog_changedAt_idx`(`changedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Expense_status_idx` ON `Expense`(`status`);

-- CreateIndex
CREATE INDEX `Expense_expenseDate_idx` ON `Expense`(`expenseDate`);

-- CreateIndex
CREATE INDEX `Expense_category_idx` ON `Expense`(`category`);

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `actors`(`_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseAuditLog` ADD CONSTRAINT `ExpenseAuditLog_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `Expense`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpenseAuditLog` ADD CONSTRAINT `ExpenseAuditLog_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `actors`(`_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
