import prisma from "../client.js";
import { APIError, STATUS_CODE, InternalServerError } from "../../Utils/app-error.js";

class phoneinventoryrepository {
  constructor() {
    this.prisma = prisma;
  }

  async findItem(stockId, tx) {
    const prismaClient = tx || this.prisma;
    try {
      const stockItem = await prismaClient.mobiles.findUnique({
        where: {
          id: stockId,
        },
        select: {
          id: true,
          stockStatus: true,
          availableStock: true,
          CategoryId: true,
          productCost: true,
          commission: true,
          IMEI: true,
        },
      });
      return stockItem;
    } catch (err) {
      console.log("ERERdata", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async findMobileItem(mobileItemId, tx) {
    const prismaClient = tx || this.prisma
    try {
      const mobileItem = await prismaClient.mobileItems.findUnique({
        where: {
          id: mobileItemId
        }
      })
      if (!mobileItem) {
        throw new APIError(
          "not found error",
          STATUS_CODE.NOT_FOUND,
          "product item not found"
        )
      }
      return mobileItem
    }
    catch (err) {
      if (err instanceof APIError) {
        throw err
      }
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error "
      )
    }
  }

  async findProductExistInShop(mobileId, shopId, tx) {

    const prismaClient = tx || this.prisma
    try {
      const product = await prismaClient.mobileItems.findFirst({
        where: {
          mobileID: mobileId,
          shopID: shopId
        }
      })
      return product
    } catch (err) {
      console.log(err)
      if (err instanceof APIError) {
        throw err
      }
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      )
    }
  }
  async createTransferHistory(id, transferData, tx) {
    const prismaClient = tx || this.prisma;
    try {
      const createdTransferHistory = await prismaClient.mobiletransferHistory.create({
        data: {
          quantity: transferData.quantity,
          status: transferData.status,
          type: transferData.type,
          shops_mobiletransferHistory_fromshopToshops: {
            connect: { id: transferData.fromShop },
          },
          shops_mobiletransferHistory_toshopToshops: {
            connect: { id: transferData.toShop },
          },
          actors_mobiletransferHistory_transferdByToactors: {
            connect: { id: transferData.transferdBy },
          },
          mobiles: {
            connect: { id: id },
          },
        },
      });
      return createdTransferHistory;
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "database transfer error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async updateMobileDistributionStatusQuantity(id, distributionData, tx) {
    const prismaClient = tx || this.prisma;
    try {
      const { status, quantity } = distributionData;
      const updatedPhone = await prismaClient.mobiles.update({
        where: {
          id: id,
        },
        data: {
          availableStock: {
            decrement: quantity,
          },
          stockStatus: status,
          updatedAt: new Date(),
        },
      });
      return updatedPhone;
    } catch (err) {
      console.log("er", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async createPhonewithFinaceDetails(payload) {
    try {
      const { phoneDetails, shopId, user, supplierId, paymentStatus } = payload;
      const newMobileProduct = await this.createphoneStock({ ...phoneDetails, supplierId, paymentStatus });
      const createPhoneMetaData = await this.createHistory({
        user,
        shopId,
        productId: newMobileProduct.id,
        type: "new stock",
      });
    } catch (err) {
      console.log("err", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "server error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async createphoneStock({
    CategoryId,
    IMEI,
    productcost,
    color,
    commission,
    discount,
    availableStock,
    faultyItems,
    supplierName,
    batchNumber,
    productType,
    storage,
    supplierId,
    paymentStatus,
  }, tx) {
    const prismaClient = tx || prisma;
    try {
      const category = parseInt(CategoryId, 10);

      const stock = await prismaClient.mobiles.create({
        data: {
          CategoryId: category,
          IMEI: IMEI,
          availableStock: availableStock,
          commission: commission,
          phoneType: productType,
          discount: discount,
          storage: storage,
          color: color,
          batchNumber: batchNumber,
          supplierName: supplierName,
          productCost: productcost,
          createdAt: new Date(),
          supplierId: supplierId,
          paymentStatus: paymentStatus,
        },
      });

      return stock;
    } catch (err) {
      console.log("err", err);
      if (err.code === "P2002") {
        throw new APIError(
          "Duplicate Key Error",
          STATUS_CODE.BAD_REQUEST,
          `A product with  ${IMEI} IMEI already exists.`
        );
      } else {
        throw new APIError(
          "API Error",
          STATUS_CODE.INTERNAL_ERROR,
          err.message || "Unable to create new goods"
        );
      }
    }
  }



  async createHistory({ productId, user, type, shopId }, tx) {
    const prismaClient = tx || prisma;
    try {
      const createHistory = await prismaClient.mobileHistory.create({
        data: {
          productID: productId,
          type: type,
          shopId: shopId,
          addedBy: user,
        },
      });
      return createHistory;
    } catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  //updating sales of a phone stock status
  async updatesalesofaphone({ id, sellerId, status }) {
    try {
      const updatedSalesofthephone = await prisma.mobileHistory.updateMany({
        where: {
          productID: id,
        },
        data: {
          sellerId: sellerId,
          type: status,
          updatedAt: new Date(),
        },
      });
      return updatedSalesofthephone;
    } catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async updateSoldPhone(id) {
    try {
      const updateSoldPhone = await prisma.mobiles.update({
        where: {
          id: id,
        },
        data: {
          stockStatus: "sold",
          updatedAt: new Date(),
        },
      });
      return updateSoldPhone;
    } catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async updateConfirmedmobileItem(confirmedData) {
    try {
      const { status, userId, transferId, shopId, mobileId } = confirmedData;
      const updatedTransfer = await prisma.mobileItems.updateMany({
        where: {
          mobileID: mobileId,
          transferId: transferId,
        },
        data: {
          confirmedBy: userId,
          status: status,
          updatedAt: new Date(),
        },
      });
      return updatedTransfer;
    } catch (err) {
      console.log("error in update", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error "
      );
    }
  }
  async updatetransferHistory(distributionData) {
    try {
      const { status, userId, id } = distributionData;
      const updatedTransferHistory = await prisma.mobiletransferHistory.update({
        where: {
          id: id,
        },
        data: {
          actors_mobiletransferHistory_confirmedByToactors: {
            connect: { id: userId },
          },
          status: status,
          updatedAt: new Date(),
        },
      });
      return updatedTransferHistory;
    } catch (err) {
      console.log("error on update", err);
      throw new APIError(
        "internal server error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error "
      );
    }
  }

  async updatethephoneStock(mobileId, updates, user, shopId, IMEI) {
    try {
      const updatedPhone = await prisma.mobiles.update({
        where: {
          id: mobileId,
        },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
      await this.createHistory({
        user,
        shopId,
        productId: mobileId,
        type: "update",
      });
      return updatedPhone;
    } catch (err) {
      if (err.code === "P2002") {
        throw new APIError(
          "Duplicate Key Error",
          STATUS_CODE.BAD_REQUEST,
          `A product with  ${IMEI} IMEI already exists.`
        );
      }
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        err.message || "Unable to update the phone"
      );
    }
  }
  async findMobileTransferHistory(id) {
    try {
      const mobileItems = await prisma.mobiletransferHistory.findUnique({
        where: {
          id: id,
        },
      });
      return mobileItems;
    } catch (err) {
      throw new APIError(
        "internal server error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async findMobileFinance(productId) {
    try {
      const finance = await prisma.mobilefinance.findFirst({
        where: {
          productID: productId,
        },
      });
      return finance;
    } catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async findAllMobileStockAvailable(page, limit) {
    try {
      // Fetch paginated and sorted mobile stock
      const stockAvailable = await prisma.mobiles.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          id: "desc",
        },
        select: {
          id: true,
          stockStatus: true,
          IMEI: true,
          productCost: true,
          color: true,
          commission: true,
          discount: true,
          batchNumber: true,
          supplierName: true,
          CategoryId: true,
          storage: true,
          itemType: true,
          updatedAt: true,
          createdAt: true,
          categories: {
            select: {
              itemName: true,
              itemModel: true,
              brand: true,
              minPrice: true,
              maxPrice: true,
            },
          },
          mobilefinance: {
            select: {
              financeAmount: true,
              financeStatus: true,
              financer: true,
            },
          },
        },
      });

      // Get the total count of available stock
      const totalItems = await prisma.mobiles.count({
        where: {
          stockStatus: "available",
        },
      });

      return { stockAvailable, totalItems };
    } catch (err) {
      console.log(err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError("databaseERROR", STATUS_CODE.INTERNAL_ERROR);
    }
  }
  //capture a specific item
  async capturespecificproductfordetails(id) {
    try {
      const productFound = await prisma.mobiles.findUnique({
        where: {
          id: id,
        },
        include: {
          categories: {
            select: {
              itemName: true,
              itemModel: true,

            },
          },
          Supplier: {
            select: {
              name: true
            }
          }
        },
      });
      //console.log(productFound);
      return productFound;
    } catch (err) {
      //console.log("error", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "databaseERROR",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async capturespecificproductfortranferhistory({ id }) {
    try {
      const productId = parseInt(id, 10);
      const productFound = await prisma.mobiletransferHistory.findMany({
        where: {
          productID: productId,
        },
        select: {
          shops_mobiletransferHistory_fromshopToshops: {
            select: {
              shopName: true,
            },
          },
          shops_mobiletransferHistory_toshopToshops: {
            select: {
              shopName: true,
            },
          },
          actors_mobiletransferHistory_confirmedByToactors: {
            select: {
              name: true,
            },
          },
          actors_mobiletransferHistory_transferdByToactors: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!productFound) {
        throw new APIError("not found", STATUS_CODE.NOT_FOUND, "not found");
      }
      return productFound;
    } catch (err) {
      console.log(err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "databaseERROR",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async capturespecificproductforhistory({ id }) {
    try {
      const productId = parseInt(id, 10);
      const productHistory = await prisma.mobileHistory.findMany({
        where: {
          productID: productId,
        },
        include: {
          actors_mobileHistory_addedByToactors: {
            select: {
              name: true,
              email: true,
            },
          },
          actors_mobileHistory_sellerIdToactors: {
            select: {
              name: true,
              email: true,
            },
          },
          shops: {
            select: {
              shopName: true,
              address: true,
            },
          },
        },
      });
      return productHistory;
    } catch (err) {
      console.log(err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "databaseERROR",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async updateMobileItemsTransfer(id, quantity, tx) {
    const prismaClient = tx || prisma;
    try {
      const updatEdTransfer = await prismaClient.mobileItems.update({
        where: {
          id: id,
        },
        //decrement the quantity of the item
        data: {
          quantity: {
            decrement: quantity,
          },
          status: "transferd",
        },
      });
    } catch (err) {
      console.log("err", err);
      throw new APIError(
        "database transfer error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async searchMobileProducts(searchItem) {
    try {
      const lowercaseSearchItem = searchItem.toLowerCase(); // Convert search term to lowercase

      const imeiMatches = await prisma.mobiles.findMany({
        where: {
          IMEI: {
            contains: lowercaseSearchItem,
          },
        },
        select: {
          id: true,
          IMEI: true,
          availableStock: true,
          productCost: true,
          commission: true,
          discount: true,
          stockStatus: true,
          batchNumber: true,
          categories: {
            select: {
              itemName: true,
              itemModel: true,
              brand: true,
            },
          },
        },
      });

      const categoryMatches = await prisma.mobiles.findMany({
        where: {
          categories: {
            OR: [
              { itemName: { contains: lowercaseSearchItem } },
              { itemModel: { contains: lowercaseSearchItem } },
              { brand: { contains: lowercaseSearchItem } },
            ],
          },
        },
        select: {
          id: true,
          IMEI: true,
          availableStock: true,
          productCost: true,
          commission: true,
          discount: true,
          stockStatus: true,
          batchNumber: true,
          categories: {
            select: {
              itemName: true,
              itemModel: true,
              brand: true,
            },
          },
        },
      });

      const combinedResults = [...imeiMatches, ...categoryMatches];

      const filteredResults = combinedResults.filter((mobile) => {
        const imeiMatch =
          mobile.IMEI?.toLowerCase().includes(lowercaseSearchItem);
        const categoryMatch =
          mobile.categories.itemName
            ?.toLowerCase()
            .includes(lowercaseSearchItem) ||
          mobile.categories.itemModel
            ?.toLowerCase()
            .includes(lowercaseSearchItem) ||
          mobile.categories.brand?.toLowerCase().includes(lowercaseSearchItem);

        return imeiMatch || categoryMatch;
      });

      return filteredResults;
    } catch (err) {
      console.error("Error:", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  async softcopyofphoneItem({ id }) {
    try {
      const deletedPhone = await Mobile.findByIdAndUpdate(
        id,
        {
          $set: { stockStatus: "deleted" },
          $push: {
            history: {
              quantity: 1,
              type: "Deleted",
            },
          },
        },
        { new: true }
      );

      if (!deletedPhone) {
        throw new APIError(
          "Product not found",
          STATUS_CODE.NOT_FOUND,
          "product not found"
        );
      }
      return deletedPhone;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }

      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async updateMobileItemStatusByTransferId(transferId, status) {
    try {
      return await prisma.mobileItems.update({
        where: {
          id: transferId,
        },
        data: {
          status: status,
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to update mobile item status"
      );
    }
  }

  //delete  mobileItem
  async deleteMobileItem(mobileItemId, tx) {
    try {
      const prismaClient = tx || this.prisma;
      return await prismaClient.mobileItems.delete({
        where: {
          id: mobileItemId
        }
      })
    } catch (err) {
      console.log("error deleting mobile item", err)
      throw new InternalServerError()
    }
  }

  //update mobile upon reversall

  async updateMobileReversalStock(id, quantity, tx) {
    const prismaClient = tx || this.prisma;
    try {
      //prismaClient.mobiles
      const updatedPhone = await prismaClient.mobiles.update({
        where: {
          id: id,
        },
        data: {
          availableStock: {
            increment: quantity,
          },
          stockStatus: "available",
          updatedAt: new Date(),
        },
      });
      return updatedPhone;
    } catch (err) {
      console.log("error displayed", err)
      throw new InternalServerError();
    }
  }
}

export { phoneinventoryrepository };
