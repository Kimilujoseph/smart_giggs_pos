import prisma from "../databases/client.js";
import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { phoneinventoryrepository } from "../databases/repository/mobile-inventory-repository.js";
import { APIError, STATUS_CODE } from "../Utils/app-error.js";

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
      const findMainShop = await this.shop.findShop({ name: "WareHouse" }, tx);
      const findMiniShop = await this.shop.findShop({ name: distributedShop }, tx);

      if (!findMainShop || !findMiniShop) {
        throw new APIError("Shop not found", STATUS_CODE.NOT_FOUND, "One of the shops could not be found.");
      }

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
          fromShop: findMainShop.id,
          toShop: findMiniShop.id,
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
          shopID: findMiniShop.id,
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
    console.log("bulk", bulkDetails)
    const { bulkDistribution, mainShop, distributedShop, userId } = bulkDetails;

    return prisma.$transaction(async (tx) => {
      const findMainShop = await this.shop.findShop({ name: "WareHouse" }, tx);
      const findMiniShop = await this.shop.findShop({ name: distributedShop }, tx);

      if (!findMainShop || !findMiniShop) {
        throw new APIError("Shop not found", STATUS_CODE.NOT_FOUND, "One of the shops could not be found.");
      }

      const results = [];
      for (const item of bulkDistribution) {
        const productId = parseInt(item.stockId, 10);

        const stockItem = await this.repository.findProductById(productId, tx);

        if (!stockItem) {
          throw new APIError("Product not found", STATUS_CODE.NOT_FOUND, `Accessory with ID ${productId} not found.`);
        }
        if (stockItem.availableStock === 0 || stockItem.stockStatus !== 'available') {
          throw new APIError("Product not available", STATUS_CODE.BAD_REQUEST, `Accessory with batch number ${stockItem.batchNumber} is not available for distribution.`);
        }


        const stockTransferHistory = await this.repository.createTransferHistory(productId, {
          quantity: item.quantity,
          fromShop: findMainShop.id,
          toShop: findMiniShop.id,
          status: "pending",
          transferdBy: userId,
          type: "distribution",
        }, tx);

        await this.repository.updateStockQuantity(productId, item.quantity, tx);

        const newItem = await this.shop.addNewAccessory(findMiniShop.id, {
          productID: productId,
          quantity: item.quantity,
          shopID: findMiniShop.id,
          status: "pending",
          transferId: stockTransferHistory.id,
          productStatus: "new stock",
        }, tx);

        results.push(newItem);
      }

      return results;
    });
  }
}

export { distributionService };
