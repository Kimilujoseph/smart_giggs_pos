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
    console.log("mainshop", mainShop, distributedShop)

    return prisma.$transaction(async (tx) => {
      const { firstShop, secondShop } = await this.findShopsByName("WareHouse", distributedShop, tx);

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
      const { firstShop, secondShop } = await this.findShopsByName("WareHouse", distributedShop, tx);


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

        const newItem = await this.shop.addNewAccessory(secondShop.id, {
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
  async createReverseDistribution(distributionDetails) {
    const { productItemId, userId, quantity, productType, fromShop } = distributionDetails
    return prisma.$transaction(async (tx) => {
      const isMobile = productType === "mobile"
      const { firstShop, secondShop } = await this.findShopsByName("WareHouse", fromShop, tx)
      const stockItem = isMobile ? await this.mobile.findMobileItem(productItemId, tx)
        : await this.repository.findAccessoryItemProduct(productItemId, tx);

      if (!stockItem || stockItem.shopID !== secondShop.id) {
        throw new NotFoundError("Product item not found");
      }
      if (stockItem.status === 'sold') {
        throw new ValidationError("The selected Item is already sold and cannot be reversed.");
      }


      const productId = isMobile ? stockItem.mobileID : stockItem.accessoryID;

      const updatedProduct = isMobile ? await this.mobile.deleteMobileItem(productItemId, tx) : await this.repository.updateStockQuantityInAshop(productItemId, quantity, tx);
      //create a transfer hsitory for reverse

      const createdReverse = isMobile ? await this.mobile.createTransferHistory(productId, {
        quantity: quantity,
        fromShop: secondShop.id,
        toShop: firstShop.id,
        status: "completed",
        transferdBy: userId,
        type: "reverse",
      }, tx) :
        await this.repository.createTransferHistory(productId, {
          quantity: quantity,
          fromShop: secondShop.id,
          toShop: firstShop.id,
          status: "completed",
          transferdBy: userId,
          type: "reverse",
        }, tx);
      const updateQuanatity = isMobile ? await this.mobile.updateMobileReversalStock(productId, quantity, tx) :
        await this.repository.updateAccessoriesOnReversal(productId, quantity, tx);
      return "Reversal completed successfully";
    })

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
