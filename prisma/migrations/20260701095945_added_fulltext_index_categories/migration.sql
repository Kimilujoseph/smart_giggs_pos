-- CreateIndex
CREATE FULLTEXT INDEX `categories_itemName_itemModel_category_brand_idx` ON `categories`(`itemName`, `itemModel`, `category`, `brand`);
