import { AccessoryInventoryRepository } from "../databases/repository/accessory-inventory-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { CategoryManagementRepository } from "../databases/repository/category-contoller-repository.js";
import { APIError, STATUS_CODE, ValidationError, NotFoundError } from "../Utils/app-error.js";
import { validateUpdateInputs, validateItemsInputs } from "../helpers/updateValidationHelper.js";
import prisma from "../databases/client.js";

class AccessoryManagementService {
  constructor() {
    this.accessory = new AccessoryInventoryRepository();
    this.shop = new ShopmanagementRepository();
    this.category = new CategoryManagementRepository();
  }

  async createNewAccessoryProduct(newAccessoryProduct) {
    return prisma.$transaction(async (tx) => {

      const { accessoryDetails, user } = newAccessoryProduct;

      const { CategoryId, supplierId } = accessoryDetails;

      const category = parseInt(CategoryId, 10);
      await this.category.getCategoryById(category, tx);
      // if (!categoryExist) {
      //   throw new ValidationError(
      //     "Invalid category",

      //   );
      // }
      const shopFound = await this.shop.findShop({ name: "WareHouse" }, tx);
      if (!shopFound) {
        throw new NotFoundError("shop seems is not available")
      }
      const shopId = shopFound.id;
      const payload = {
        ...accessoryDetails,
        shopId,
        user,
        supplierId: parseInt(supplierId, 10),
      };
      const newProduct = await this.accessory.createAccessoryHistoryDetails(
        payload,
        tx
      );
      return newProduct;
    });
  }

  async findSpecificAccessoryProduct(id) {
    const findSpecificProduct =
      await this.accessory.captureSpecificAccessoryForDetails(id);
    return findSpecificProduct;

  }

  async getProductTransferHistory({ id }) {

    const transferHistory =
      await this.accessory.captureSpecificAccessoryForTransferHistory({ id });
    if (transferHistory.length === 0 || !transferHistory) {
      throw new NotFoundError(
        "No transfer history for this product found"
      )
    }
    return transferHistory;
  }


  async getProductHistory({ id }) {

    const history = await this.accessory.captureSpecificAccessoryForHistory({
      id,
    });
    if (history.length === 0) {
      throw new NotFoundError(
        "No history found for this product",
      )
    }
    return history;
  }




  async updateAccessoryStock(id, updates, userId) {

    const accessoryId = Number(id);
    const user = parseInt(userId, 10);
    if (isNaN(accessoryId)) {
      throw new ValidationError(
        "Invalid value provided"
      )
    }

    const [shopFound, accessoryFound] = await Promise.all([
      this.shop.findShop({ name: "WareHouse" }),
      this.accessory.findItem(accessoryId),
    ]);
    if (!shopFound) {
      throw new NotFoundError(
        "Shop not found",
      );
    }
    const shopId = shopFound.id;
    if (!accessoryFound) {
      throw new NotFoundError(
        "Accessory not found"
      );
    }
    if (
      accessoryFound.stockStatus === "sold" &&
      validUpdates.stockStatus !== "sold"
    ) {
      throw new ValidationError(

        `Accessory ${accessoryFound.batchNumber} already sold, please contact the admin`
      );
    }
    const validUpdates = validateItemsInputs(updates);
    if (validUpdates.productCost && validUpdates.commission) {
      if (validUpdates.commission > accessoryFound.productCost * 0.2) {
        throw new ValidationError(
          "Commission cannot exceed 20% of product cost"
        );
      }
    }
    console.log(validUpdates["faultyItems"])
    if (validUpdates["faultyItems"] > 0) {
      if (validUpdates["faultyItems"] > accessoryFound.availableStock) {
        throw new ValidationError(
          "Faulty items cannot exceed available stock",
        );
      }
      const update = await prisma.$transaction(async (tx) => {
        const faultStockUpdates = await this.accessory.updateFaultyAccessoryStock(accessoryId, validUpdates, user, shopId, tx);
        return faultStockUpdates;
      })
      return update;
    }
    else {
      //remove a property from the validUpdates i.e faultyItems
      delete validUpdates["faultyItems"];
      const updatedAccessory = await this.accessory.updateTheAccessoryStock(
        accessoryId,
        validUpdates,
        user,
        shopId
      );
      return updatedAccessory;
    }
  }

  async findAllAccessoryProduct(page, limit) {

    const { stockAvailable, totalItems } =
      await this.accessory.findAllAccessoryStockAvailable(page, limit);
    const filteredItem = stockAvailable.filter(
      (item) =>
        item !== null ||
        item.history !== null ||
        item.stockStatus === "Deleted"
    );
    return { filteredItem, totalItems, page, limit };
  }


  async createNewSoftDeletion(itemId) {
    const deletedItem = await this.accessory.softCopyOfAccessoryItem({ id: itemId });
    if (!deletedItem) {
      throw new NotFoundError("product not found for deletion")
    }
    return deletedItem;
  }

  async searchForAccessory(searchItem) {
    try {
      const searchResult = await this.accessory.searchAccessoryProducts(searchItem);
      return searchResult;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError("Search Error", STATUS_CODE.INTERNAL_ERROR, err);
    }
  }
}

export { AccessoryManagementService };
