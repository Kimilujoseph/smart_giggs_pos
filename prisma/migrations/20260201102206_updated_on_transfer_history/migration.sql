-- AlterTable
ALTER TABLE `accessorytransferhistory` MODIFY `type` ENUM('distribution', 'transfer', 'return', 'reverse') NULL;

-- AlterTable
ALTER TABLE `mobiletransferHistory` MODIFY `type` ENUM('distribution', 'transfer', 'return', 'reverse') NULL;
