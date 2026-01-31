import prisma from "../databases/client.js";
import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { phoneinventoryrepository } from "../databases/repository/mobile-inventory-repository.js";
import { APIError, NotFoundError, ValidationError, STATUS_CODE } from "../Utils/app-error.js";

class distributionService {
  constructor() {
    this.repository = new InventorymanagementRepository(prisma);
    this.shop = new ShopmanagementRepository(prisma);
    this.mobile = new phoneinventoryrepository(prisma);
  }

  async createBulkMobileDistribution(bulkDetails) {
    const { bulkDistribution, mainShop, distributedShop, userId } = bulkDetails;

    //async _validateAndFetchShops(manr)

    return prisma.$transaction(async (tx) => {
      const { firstShop, secondShop } = await this.findShopsByName(mainShop, distributedShop, tx);

      const results = [];
      for (const item of bulkDistribution) {
        const productId = parseInt(item.stockId, 10);

        const stockItem = await this.mobile.findItem(productId, tx);

        if (!stockItem) {
          throw new APIError("Product not found", STATUS_CODE.NOT_FOUND, `Mobile with ID ${productId} not found.`);
        }
        if (stockItem.availableStock === 0 || stockItem.stockStatus !== 'available') {
          throw new APIError("Product not available", STATUS_CODE.BAD_REQUEST, `Mobile with IMEI ${stockItem.IMEI} is not available for distribution.`);
        }

        // Step 1: Create the transfer history (now without side effects)
        const stockTransferHistory = await this.mobile.createTransferHistory(productId, {
          quantity: 1,
          fromShop: firstShop.id,
          toShop: secondShop.id,
          status: "pending",
          transferdBy: userId,
          type: "distribution",
        }, tx);

        // Step 2: Update the mobile's stock status
        await this.mobile.updateMobileDistributionStatusQuantity(productId, {
          quantity: 1,
          status: "distributed",
        }, tx);

        // Step 3: Explicitly create the mobileItem, ensuring it's part of the transaction
        const newItem = await this.shop.newAddedphoneItem({
          productID: productId,
          categoryId: stockItem.CategoryId,
          quantity: 1,
          shopID: secondShop.id,
          status: "pending",
          transferId: stockTransferHistory.id,
          productStatus: "new stock",
        }, tx);

        results.push(newItem);
      }

      return results;
    });
  }

  async createBulkAccessoryDistribution(bulkDetails) {
    //console.log("bulk", bulkDetails)
    const { bulkDistribution, mainShop, distributedShop, userId } = bulkDetails;

    return prisma.$transaction(async (tx) => {
      const { firstShop, secondShop } = await this.findShopsByName(mainShop, distributedShop, tx);


      const results = [];
      for (const item of bulkDistribution) {
        const productId = parseInt(item.stockId, 10);

        const stockItem = await this.repository.findProductById(productId, tx);

        if (!stockItem) {
          throw new NotFoundError(`Accessory with ID ${productId} not found.`);
        }
        if (stockItem.availableStock === 0 || stockItem.stockStatus !== 'available') {
          throw new ValidationError(`Accessory with ID ${productId} is not available for distribution.`);
        }


        const stockTransferHistory = await this.repository.createTransferHistory(productId, {
          quantity: item.quantity,
          fromShop: firstShop.id,
          toShop: secondShop.id,
          status: "pending",
          transferdBy: userId,
          type: "distribution",
        }, tx);

        await this.repository.updateStockQuantity(productId, item.quantity, tx);

        const newItem = await this.shop.addNewAccessory(findMiniShop.id, {
          productID: productId,
          quantity: item.quantity,
          shopID: secondShop.id,
          status: "pending",
          transferId: stockTransferHistory.id,
          productStatus: "new stock",
        }, tx);

        results.push(newItem);
      }

      return results;
    });
  }

  async findShopsByName(firstShopName, secondShopName, tx) {
    const firstShop = await this.shop.findShop({ name: firstShopName }, tx);
    const secondShop = await this.shop.findShop({ name: secondShopName }, tx);

    if (!firstShop || !secondShop) {
      throw new NotFoundError("One or both shops not found");
    }

    return { firstShop, secondShop };
  }
}

export { distributionService };
