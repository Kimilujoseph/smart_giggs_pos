import prisma from "../client.js";
import { APIError, STATUS_CODE, InternalServerError } from "../../Utils/app-error.js";

class ShopmanagementRepository {
  constructor() {
    this.prisma = prisma;
  }

  async createShop({ name, address }) {
    try {

      const shop = await this.prisma.shops.create({
        data: {
          shopName: name,
          address: address,
        },
      });
      return shop;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "API Error",
        STATUS_CODE.INTERNAL_ERROR,
        "unable to Create Shop"
      );
    }
  }

  async findShopById(id) {
    try {
      const shopFound = await this.prisma.shops.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          shopName: true,
          address: true,
        },
      });
      if (!shopFound) {
        throw new APIError(
          "not found",
          STATUS_CODE.NOT_FOUND,
          "Shop not found"
        );
      }
      return shopFound;
    } catch (err) {
      console.log("finding shop error", err);
      throw new APIError(
        "API Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Unable to find Shop"
      );
    }
  }

  async findShop({ name }, tx) {
    //console.log("shopname received", name)
    const prismaClient = tx || this.prisma;
    try {
      const findShop = await prismaClient.shops.findFirst({
        where: {
          shopName: name,
        },
        select: {
          id: true,
          shopName: true,
          address: true,
          assignment: {
            select: {
              id: true,
              actors: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                },
              },
              fromDate: true,
              toDate: true,
              status: true,
            },
          },
        },
      });
      //console.log("findShop result:", findShop);
      return findShop;
    } catch (err) {

      throw new InternalServerError();
    }
  }

  async findShopsAvailable() {
    try {
      const findShop = await this.prisma.shops.findMany({
        select: {
          id: true,
          shopName: true,
          address: true,
        },
      });

      return findShop;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "API Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Unable to find the shop"
      );
    }
  }

  async findSpecificShopItem({ name, requestedItem, page = 1, limit = 10, status }) {
    try {
      const shop = await this.prisma.shops.findFirst({
        where: { shopName: name },
        select: { id: true, shopName: true },
      });

      if (!shop) {
        throw new APIError(
          "Shop not found",
          STATUS_CODE.NOT_FOUND,
          "Shop not found"
        );
      }

      const whereClause = {
        shopID: shop.id,
        quantity: { gt: 0 }
      };

      if (status) {
        whereClause.status = status;
      } else {
        whereClause.status = "confirmed";
      }

      let items = [];
      let totalItems = 0;
      const skip = (page - 1) * limit;

      if (requestedItem === "mobileItems") {
        items = await this.prisma.mobileItems.findMany({
          where: whereClause,
          skip: skip,
          take: limit,
          include: {
            mobiles: {
              select: {
                categories: true,
                IMEI: true,
                batchNumber: true,
                color: true,
                productCost: true,
                discount: true,
                stockStatus: true,
              },
            },
          },
        });
        totalItems = await this.prisma.mobileItems.count({ where: whereClause });
      } else if (requestedItem === "accessoryItems") {
        items = await this.prisma.accessoryItems.findMany({
          where: whereClause,
          skip: skip,
          take: limit,
          include: {
            accessories: {
              select: {
                categories: true,
                productCost: true,
                discount: true,
                stockStatus: true,
                batchNumber: true,
              },
            },
          },
        });
        totalItems = await this.prisma.accessoryItems.count({ where: whereClause });
      } else {
        throw new APIError(
          "Invalid requested item type",
          STATUS_CODE.BAD_REQUEST,
          "Invalid item type. Should be phoneItems or stockItems"
        );
      }

      return {
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        items: items,
      };
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "API Error",
        STATUS_CODE.INTERNAL_ERROR,
        err.message || "Unable to find the shop"
      );
    }
  }

  async getShopStockOverviewData({ name }) {
    try {
      const shop = await this.prisma.shops.findFirst({
        where: { shopName: name },
        select: { id: true },
      });

      if (!shop) {
        throw new APIError(`Shop with name ${name} not found`);
      }

      const mobileItems = await this.prisma.mobileItems.findMany({
        where: { shopID: shop.id },
        select: {
          quantity: true,
          status: true,
          mobiles: {
            select: {
              productCost: true,
              categories: {
                select: {
                  itemName: true,
                },
              },
            },
          },
        },
      });

      const accessoryItems = await this.prisma.accessoryItems.findMany({
        where: { shopID: shop.id },
        select: {
          quantity: true,
          status: true,
          accessories: {
            select: {
              productCost: true,
              categories: {
                select: {
                  itemName: true,
                },
              },
            },
          },
        },
      });

      const lowStockMobiles = await this.prisma.mobileItems.findMany({
        where: { shopID: shop.id, status: 'confirmed', quantity: { lt: 0 } },
        include: { mobiles: { include: { categories: true } } },
      });

      const lowStockAccessories = await this.prisma.accessoryItems.findMany({
        where: { shopID: shop.id, status: 'confirmed', quantity: { lt: 5 } },
        include: { accessories: { include: { categories: true } } },
      });

      return { mobileItems, accessoryItems, lowStockMobiles, lowStockAccessories };
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Error fetching stock overview data",
        STATUS_CODE.INTERNAL_ERROR,
        err.message
      );
    }
  }

  async updateShopDetails(shopID, shopDetails) {
    try {
      const shop = await this.findShopById(shopID);
      if (!shop) {
        throw new APIError(
          "Shop not found",
          STATUS_CODE.NOT_FOUND,
          "Shop not found"
        );
      }
      const updatedShop = await this.prisma.shops.update({
        where: { id: shopID },
        data: shopDetails,
      });

      return updatedShop;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "API Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Unable to update Shop"
      );
    }
  }

  async updateSalesOfAccessory(shopId, transferId, soldUnits) {
    console.log("@@#soldunits", soldUnits);
    try {
      const accessoryItemUpdate = await this.prisma.accessoryItems.updateMany({
        where: {
          shopID: shopId,
          transferId: transferId,
        },
        data: {
          quantity: {
            increment: soldUnits,
          },
        },
      });
      return accessoryItemUpdate;
    } catch (err) {
      console.log(err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Update error",
        STATUS_CODE.INTERNAL_ERROR,
        "Server error"
      );
    }
  }

  async updateSalesOfPhone(shopId, productID, soldUnits) {
    try {
      const mobileItem = await this.prisma.mobileItems.findFirst({
        where: {
          shopID: shopId,
          mobileID: productID,
          status: "confirmed",
        },
      });
      if (!mobileItem) {
        throw new APIError(
          "not found",
          STATUS_CODE.BAD_REQUEST,
          "mobile item not found"
        );
      }

      const updateSalesOfPhone = await this.prisma.mobileItems.update({
        where: {
          id: mobileItem.id,
        },
        data: {
          quantity: {
            decrement: soldUnits,
          },
          status: "sold",
          updatedAt: new Date(),
        },
      });

      return updateSalesOfPhone;
    } catch (err) {
      console.log("error in updating", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "update error",
        STATUS_CODE.INTERNAL_ERROR,
        "server error"
      );
    }
  }

  async searchProductName(productName, shopName, page = 1, limit = 10) {
    try {
      const shop = await this.prisma.shops.findFirst({
        where: { shopName: shopName },
        select: { id: true },
      });

      if (!shop) {
        throw new APIError(`Shop with name ${shopName} not found`);
      }

      const searchTerm = productName ? productName.toLowerCase() : "";
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const mobileWhere = {
        shopID: shop.id,
        mobiles: {
          OR: [
            { categories: { itemName: { contains: searchTerm, } } },
            { categories: { itemModel: { contains: searchTerm } } },
            { categories: { brand: { contains: searchTerm } } },
            { IMEI: { contains: searchTerm } },
          ],
        },
      };

      const accessoryWhere = {
        shopID: shop.id,
        accessories: {
          categories: {
            OR: [
              { itemName: { contains: searchTerm } },
              { itemModel: { contains: searchTerm } },
              { brand: { contains: searchTerm } },
            ],
          },
        },
      };

      const phoneItems = await this.prisma.mobileItems.findMany({
        where: mobileWhere,
        skip: skip,
        take: parseInt(limit),
        include: {
          mobiles: {
            include: {
              categories: true,
            },
          },
        },
      });

      const totalPhones = await this.prisma.mobileItems.count({ where: mobileWhere });

      const stockItems = await this.prisma.accessoryItems.findMany({
        where: accessoryWhere,
        skip: skip,
        take: parseInt(limit),
        include: {
          accessories: {
            include: {
              categories: true,
            },
          },
        },
      });

      const totalAccessories = await this.prisma.accessoryItems.count({ where: accessoryWhere });

      return {
        phoneItems: {
          items: phoneItems,
          totalItems: totalPhones,
          totalPages: Math.ceil(totalPhones / limit),
          currentPage: parseInt(page),
        },
        stockItems: {
          items: stockItems,
          totalItems: totalAccessories,
          totalPages: Math.ceil(totalAccessories / limit),
          currentPage: parseInt(page),
        },
      };
    } catch (err) {
      console.log("erroror", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "err fetching products",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server errorr"
      );
    }
  }

  async newAddedphoneItem(newItem, tx) {
    const prismaClient = tx || this.prisma;
    try {
      console.log("new Item details", newItem)
      const updatedShop = await prismaClient.mobileItems.create({
        data: {
          status: newItem.status,
          productStatus: newItem.productStatus,
          transferId: newItem.transferId,
          quantity: newItem.quantity,
          shops: {
            connect: { id: newItem.shopID },
          },
          mobiles: {
            connect: { id: newItem.productID },
          },
        },
      });
      return updatedShop;
    } catch (err) {
      console.error("Error in newAddedphoneItem:", err);
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "database error"
      );
    }
  }

  async updateConfirmationOfProduct(shopId, newPhoneItemId, userName) {
    try {
      const updatedNewPhoneItem = await this.prisma.mobileItems.update({
        where: {
          id: newPhoneItemId,
        },
        data: {
          status: "confirmed",
          confirmedBy: userName,
          updatedAt: new Date.now(),
        },
      });

      return updatedNewPhoneItem;
    } catch (err) {
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async addNewAccessory(shopId, newItem, tx) {
    const prismaClient = tx || this.prisma;
    try {
      const newAccessoryItem = await prismaClient.accessoryItems.create({
        data: {
          accessoryID: newItem.productID,
          quantity: newItem.quantity,
          shopID: shopId,
          status: newItem.status || "pending",
          transferId: newItem.transferId,
          productStatus: newItem.productStatus || "new stock",
          confirmedBy: null,
          createdAt: new Date(),
        },
      });

      return newAccessoryItem;
    } catch (err) {
      console.error("Error adding new accessory item:", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Unable to add new accessory item"
      );
    }
  }

  async updateConfirmationOfAccessory(
    shopId,
    transferproductId,
    userId,
    accessoryId,
    tx
  ) {
    const prismaClient = tx || this.prisma;
    try {
      console.log("accessoryIDpASDED", accessoryId)
      const updatedNewAccessoryItem = await prismaClient.accessoryItems.update({
        where: {
          id: accessoryId
        },
        data: {
          status: "confirmed",
          confirmedBy: userId,
          updatedAt: new Date(),
        },
      });
      return updatedNewAccessoryItem;
    } catch (err) {
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async updateAccessoryQuantity(shopId, accessoryId, quantity) {
    try {
      const updatedNewAccessoryItem = await this.prisma.accessoryItems.updateMany({
        where: {
          shopID: shopId,
          accessoryID: accessoryId,
        },
        data: {
          quantity: {
            increment: quantity,
          },
        },
      });
      return updatedNewAccessoryItem;
    } catch (err) {
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
}

export { ShopmanagementRepository };
