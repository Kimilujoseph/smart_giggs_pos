import { APIError, STATUS_CODE } from "../Utils/app-error.js";
import { phoneinventoryrepository } from "../databases/repository/mobile-inventory-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import prisma from "../databases/client.js";

class transferManagementService {
  constructor() {
    this.mobile = new phoneinventoryrepository();
    this.shop = new ShopmanagementRepository();
    this.repository = new InventorymanagementRepository();
  }

  _validateQuantity(quantity) {
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      throw new APIError(
        "transfer error",
        STATUS_CODE.BAD_REQUEST,
        "please insert a number for quantity"
      );
    }
    return parsedQuantity;
  }

  async _validateAndFetchShops(mainShop, distributedShop, tx) {
    const [ShopOwningtheItem, ShoptoOwntheItem] = await Promise.all([
      this.shop.findShop({ name: mainShop }, tx),
      this.shop.findShop({ name: distributedShop }, tx),
    ]);

    if (!ShopOwningtheItem || !ShoptoOwntheItem) {
      throw new APIError(
        "Shop not found",
        404,
        "One of the specified shops does not exist"
      );
    }

    const shopId = parseInt(ShopOwningtheItem.id, 10);
    const shopToId = parseInt(ShoptoOwntheItem.id, 10);

    if (shopId === shopToId) {
      throw new APIError(
        "transfer error",
        STATUS_CODE.BAD_REQUEST,
        "you cannot tranfer to the same shop"
      );
    }

    return { ShopOwningtheItem, ShoptoOwntheItem, shopId, shopToId };
  }

  async _handleMobileDestinationInventory(details, tx) {
    const { mobileId, shopToId, parsedQuantity, stockItem, distributionId } =
      details;
    const existingStock = await this.mobile.findProductExistInShop(
      mobileId,
      shopToId,
      tx
    );

    if (!existingStock) {
      const phoneDetails = {
        productID: mobileId,
        categoryId: stockItem.CategoryId,
        quantity: parsedQuantity,
        status: "pending",
        shopID: shopToId,
        transferId: distributionId,
        productStatus: "new stock",
      };
      await this.shop.newAddedphoneItem(phoneDetails, tx);
    } else if (existingStock.quantity === 0) {
      const phoneDetails = {
        productID: mobileId,
        categoryId: stockItem.CategoryId,
        quantity: parsedQuantity,
        status: "pending",
        shopID: shopToId,
        transferId: distributionId,
        productStatus: "return of product",
      };
      await this.shop.newAddedphoneItem(phoneDetails, tx);
    } else {
      throw new APIError(
        "phone inserting error",
        STATUS_CODE.BAD_REQUEST,
        "phone already exist"
      );
    }
  }

  async _handleAccessoryDestinationInventory(details, tx) {
    const {
      accessoryId,
      shopToId,
      parsedQuantity,
      stockItem,
      distributionId,
      distributedShop,
    } = details;
    const existingStock = await this.repository.findProductExistInShop(
      accessoryId,
      shopToId
    );

    if (!existingStock) {
      const stockDetails = {
        productID: accessoryId,
        quantity: parsedQuantity,
        status: "pending",
        transferId: distributionId,
        productStatus: "new stock",
      };
      await this.shop.addNewAccessory(shopToId, stockDetails, tx);
    } else if (existingStock.quantity < 10) {
      const stockDetails = {
        productID: accessoryId,
        quantity: parsedQuantity,
        status: "pending",
        transferId: distributionId,
        categoryId: stockItem.CategoryId,
        productStatus: "added stock",
      };
      await this.shop.addNewAccessory(shopToId, stockDetails, tx);
    } else {
      throw new APIError(
        "enough stock already available",
        STATUS_CODE.BAD_REQUEST,
        `enough stock already exist in ${distributedShop}`
      );
    }
  }

  async createNewMobileTransfer(transferDetails) {
    return prisma.$transaction(async (tx) => {
      const { mainShop, distributedShop, productId, productItemId, userId } =
        transferDetails;
      const parsedQuantity = 1;
      const mobileId = parseInt(productId, 10);

      const { shopId, shopToId } = await this._validateAndFetchShops(
        mainShop,
        distributedShop,
        tx
      );

      const [stockItem, mobileShopItem] = await Promise.all([
        this.mobile.findItem(mobileId, tx),
        this.mobile.findMobileItem(productItemId, tx),
      ]);

      if (!stockItem) {
        throw new APIError(
          "transfer error",
          STATUS_CODE.BAD_REQUEST,
          "stock not found"
        );
      } else if (stockItem.stockStatus === "faulty") {
        throw new APIError(
          "transfer error",
          STATUS_CODE.BAD_REQUEST,
          "stock is faulty"
        );
      }

      if (
        mobileShopItem.mobileID !== mobileId ||
        mobileShopItem.status !== "confirmed"
      ) {
        throw new APIError(
          "transfer error",
          STATUS_CODE.BAD_REQUEST,
          `Stock not found in ${mainShop} or is not in a transferable state.`
        );
      }

      if (mobileShopItem.quantity < parsedQuantity) {
        throw new APIError(
          "transfer error",
          STATUS_CODE.BAD_REQUEST,
          `not enough stock to transfer ${parsedQuantity} units`
        );
      }

      await this.mobile.updateMobileItemsTransfer(
        productItemId,
        parsedQuantity,
        tx
      );

      const newTransfer = {
        quantity: parsedQuantity,
        fromShop: shopId,
        toShop: shopToId,
        transferdBy: userId,
        status: "pending",
        type: "transfer",
      };

      const newTransferHistory = await this.mobile.createTransferHistory(
        mobileId,
        newTransfer,
        tx
      );
      //lets delete the item  from the shop inventiory and add it to the new shop inventory
      await this.mobile.deleteMobileItem(productItemId, tx);
      await this._handleMobileDestinationInventory(
        {
          mobileId,
          shopToId,
          parsedQuantity,
          stockItem,
          distributionId: newTransferHistory.id,
        },
        tx
      );
    });
  }

  async createnewAccessoryTransfer(transferDetails) {
    return prisma.$transaction(async (tx) => {
      const {
        mainShop,
        distributedShop,
        productId,
        productItemId,
        quantity,
        userId,
        transferId,
      } = transferDetails;

      const parsedQuantity = this._validateQuantity(quantity);
      const { ShopOwningtheItem, shopId, shopToId } =
        await this._validateAndFetchShops(mainShop, distributedShop, tx);

      const accessoryId = parseInt(productId, 10);
      const accessoryItemId = parseInt(productItemId, 10);
      const itemTransferId = parseInt(transferId, 10);
      const sellerId = parseInt(userId, 10);

      const [stockItem, shopStockItem] = await Promise.all([
        this.repository.findProductById(accessoryId, tx),
        this.repository.findAccessoryItemProduct(accessoryItemId, tx),
      ]);

      if (!stockItem) {
        throw new APIError("product not found", STATUS_CODE.NOT_FOUND);
      }

      if (
        stockItem.stockStatus === "deleted" ||
        stockItem.stockStatus === "suspended"
      ) {
        throw new APIError(
          "bad request",
          STATUS_CODE.BAD_REQUEST,
          `the product is ${stockItem.stockStatus}`
        );
      }

      const sellerAssinged = ShopOwningtheItem.assignment.find(
        (seller) => seller.actors.id === sellerId
      );
      if (!sellerAssinged) {
        throw new APIError(
          "Unauthorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to perform this action"
        );
      }

      if (
        shopStockItem.accessoryID !== accessoryId ||
        shopStockItem.transferId !== itemTransferId
      ) {
        throw new APIError(
          "transfer error",
          STATUS_CODE.BAD_REQUEST,
          `Stock not found in ${mainShop}`
        );
      }

      if (shopStockItem.quantity < parsedQuantity) {
        throw new APIError(
          "transfer error",
          STATUS_CODE.BAD_REQUEST,
          `not enough stock to transfer ${parsedQuantity} units`
        );
      }

      await this.repository.decrementAccessoryItemQuantity(
        accessoryItemId,
        parsedQuantity,
        tx
      );

      const newTransfer = {
        quantity: parsedQuantity,
        fromShop: shopId,
        toShop: shopToId,
        userId: sellerId,
        productId: accessoryId,
        transferdBy: sellerId,
        status: "pending",
        type: "transfer",
      };

      const newTransferHistory = await this.repository.createTransferHistory(
        accessoryId,
        newTransfer,
        tx
      );

      await this._handleAccessoryDestinationInventory(
        {
          accessoryId,
          shopToId,
          parsedQuantity,
          stockItem,
          distributionId: newTransferHistory.id,
          distributedShop,
        },
        tx
      );
    });
  }
}

export { transferManagementService };
