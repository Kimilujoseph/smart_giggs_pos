import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../client.js";
import {
  APIError,
  STATUS_CODE,
  InternalServerError,
} from "../../Utils/app-error.js";
//const prisma = new PrismaClient();
class Sales {
  constructor() {
    this.prisma = prisma;
  }
  async createPayment(paymentData, tx) {
    try {
      const prismaCLient = tx || this.prisma;
      const payment = await prismaCLient.payment.create(paymentData);
      return payment;
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }

  async createnewMobilesales(salesDetails, tx) {
    try {
      const prismaCLient = tx || this.prisma;
      return await prismaCLient.mobilesales.create(salesDetails);
    } catch (err) {
      console.log("creating sales error ", err);
      throw new InternalServerError("Internal server error");
    }
  }
  async createnewAccessoriesales(salesDetails, tx) {
    try {
      const prismaClient = tx || this.prisma;
      return await prismaClient.accessorysales.create(salesDetails);
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }

  async findSales({
    salesTable,
    startDate,
    endDate,
    page,
    limit,
    shopId,
    categoryId,
    userId,
    financerId,
    financeStatus,
  }) {
    try {
      const salesModel = prisma[salesTable];
      const skip = (page - 1) * limit;
      const whereClause = {
        createdAt: { gte: startDate, lte: endDate },
      };
      if (userId) {
        whereClause.sellerId = userId;
      }
      if (shopId) {
        whereClause.shopID = shopId;
      }

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      if (financerId) {
        whereClause.financerId = financerId;
      }

      if (financeStatus) {
        whereClause.financeStatus = financeStatus;
      }

      const includeClause =
        salesTable === "mobilesales"
          ? {
              mobiles: {
                select: {
                  IMEI: true,
                  productCost: true,
                  batchNumber: true,
                  phoneType: true,
                  supplierId: true,
                  storage: true,
                  color: true,
                  paymentStatus: true,
                },
              },
              shops: {
                select: {
                  id: true,
                  shopName: true,
                },
              },
              categories: {
                select: {
                  itemName: true,
                  itemModel: true,
                  itemType: true,
                  brand: true,
                  category: true,
                },
              },
              actors: {
                select: {
                  id: true,
                  name: true,
                },
              },
              Financer: {
                select: {
                  name: true,
                },
              },
              //Payment: true
            }
          : {
              accessories: true,
              shops: {
                select: {
                  shopName: true,
                },
              },
              categories: {
                select: {
                  itemName: true,
                  itemModel: true,
                  itemType: true,
                  brand: true,
                  category: true,
                },
              },
              actors: {
                select: {
                  id: true,
                  name: true,
                },
              },
              Financer: {
                select: {
                  name: true,
                },
              },
              //Payment: true
            };
      const [results, totals] = await Promise.all([
        salesModel.findMany({
          where: whereClause,
          include: includeClause,
          orderBy: { createdAt: "desc" },
          skip: skip,
          take: limit,
        }),
        salesModel.aggregate({
          where: whereClause,
          _sum: {
            soldPrice: true,
            profit: true,
            commission: true,
            commissionPaid: true,
            financeAmount: true,
          },
          _count: true,
        }),
      ]);

      const transformSale = (sale) => ({
        ...sale,
        productDetails:
          salesTable === "mobilesales" ? sale.mobiles : sale.accessories,
        shopDetails: sale.shops,
        sellerDetails: sale.actors,
        categoryDetails: sale.categories,
        financeDetails: {
          financeStatus: sale.financeStatus || "N/A",
          financeAmount: sale.financeAmount || 0,
          financer: sale.Financer?.name || "N/A",
        },
      });

      return {
        data: results.map(transformSale),
        totals: {
          totalSales: Number(totals._sum.soldPrice) || 0,
          totalProfit: Number(totals._sum.profit) || 0,
          totalCommission: Number(totals._sum.commission) || 0,
          totalCommissionPaid: Number(totals._sum.commissionPaid) || 0,
          totalItems: Number(totals._count) || 0,
          totalFinanceAmount: Number(totals._sum.financeAmount) || 0,
        },
      };
    } catch (err) {
      //console.error("Database error:", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve sales data"
      );
    }
  }
  async getProductDetails(salesTable, productID) {
    if (!Array.isArray(productID)) {
      throw new APIError(
        "internal server error",
        STATUS_CODE.INTERNAL_ERROR,
        "Invalid product ID"
      );
    }
    return salesTable === "mobilesales"
      ? prisma.mobiles.findMany({
          where: { id: { in: productID } },
          include: { categories: true },
        })
      : prisma.accessories.findMany({
          where: { id: { in: productID } },
        });
  }
  mapFinanceDetails(sale) {
    return {
      financeStatus: sale.financeStatus || "N/A",
      financeAmount: sale.financeAmount || 0,
      financer: sale.Financer?.name || "N/A",
    };
  }

  async findUserSales({
    salesTable,
    userId,
    startDate,
    endDate,
    page,
    limit,
    financerId,
    financeStatus,
  }) {
    try {
      const salesModel = this.prisma[salesTable];
      const skip = (page - 1) * limit;
      const whereClause = {
        sellerId: userId,
        createdAt: { gte: startDate, lte: endDate },
      };

      if (financerId) {
        whereClause.financerId = financerId;
      }

      if (financeStatus) {
        whereClause.financeStatus = financeStatus;
      }

      const includeClause =
        salesTable === "mobilesales"
          ? {
              mobiles: {
                select: {
                  IMEI: true,
                  productCost: true,
                  batchNumber: true,
                  phoneType: true,
                  supplierId: true,
                  storage: true,
                  color: true,
                  paymentStatus: true,
                },
              },
              shops: {
                select: {
                  id: true,
                  shopName: true,
                },
              },
              categories: {
                select: {
                  itemName: true,
                  itemModel: true,
                  itemType: true,
                  brand: true,
                  category: true,
                },
              },
              actors: {
                select: {
                  id: true,
                  name: true,
                },
              },
              Financer: {
                select: {
                  name: true,
                },
              },
              //Payment: true
            }
          : {
              accessories: true,
              shops: {
                select: {
                  shopName: true,
                },
              },
              categories: {
                select: {
                  itemName: true,
                  itemModel: true,
                  itemType: true,
                  brand: true,
                  category: true,
                },
              },
              actors: {
                select: {
                  id: true,
                  name: true,
                },
              },
              Financer: {
                select: {
                  name: true,
                },
              },
              //Payment: true
            };

      const results = await salesModel.findMany({
        where: whereClause,
        include: includeClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
      const totals = await salesModel.aggregate({
        where: whereClause,
        _sum: {
          soldPrice: true,
          profit: true,
          commission: true,
          commissionPaid: true,
          financeAmount: true,
        },
        _count: true,
      });

      const transformSale = (sale) => ({
        ...sale,
        productDetails:
          salesTable === "mobilesales" ? sale.mobiles : sale.accessories,
        shopDetails: sale.shops,
        sellerDetails: sale.actors,
        categoryDetails: sale.categories,
        financeDetails: {
          financeStatus: sale.financeStatus || "N/A",
          financeAmount: sale.financeAmount || 0,
          financer: sale.Financer?.name || "N/A",
        },
      });
      // console.log("total profit", totals._sum.profit);
      return {
        data: results.map(transformSale),
        totals: {
          totalSales: Number(totals._sum.soldPrice) || 0,
          totalProfit: Number(totals._sum.profit) || 0,
          totalCommission: Number(totals._sum.commission) || 0,
          totalCommissionPaid: Number(totals._sum.commissionPaid) || 0,
          totalItems: Number(totals._count) || 0,
          totalFinanceAmount: Number(totals._sum.financeAmount) || 0,
        },
      };
    } catch (err) {
      console.log("Error retrieving user sales:", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve user sales"
      );
    }
  }

  async findCategorySales({ categoryId, startDate, endDate }) {
    return this.prisma.sales.findMany({
      where: {
        categoryId,
        createdAt: { gte: startDate, lte: endDate },
        OR: [
          { saleType: "direct" },
          {
            saleType: "finance",
            financeStatus: { not: "pending" },
          },
        ],
      },
      include: { categoryId: true },
    });
  }
  async payCommission(salesId, updatedData) {
    return await salesDatabase.findByIdAndUpdate(salesId, updatedData, {
      new: true,
    });
  }

  transformUserSale(sale, tableName) {
    // Common properties
    const base = {
      soldprice: Number(sale.soldPrice),
      totalprofit: sale.profit,
      totaltransaction: sale.quantity || 1,
      productDetails: {
        productID: sale.productID,
        productCost:
          tableName === "mobilesales"
            ? sale.mobiles?.productCost
            : sale.accessories?.productCost,
        batchNumber:
          tableName === "mobilesales"
            ? sale.mobiles?.batchNumber
            : sale.accessories?.batchNumber,
        productType:
          tableName === "mobilesales"
            ? sale.mobiles?.itemType
            : sale.accessories?.productType,
      },
      categoryDetails: {
        categoryId: sale.categoryId,
        itemName: sale.categories?.itemName,
        itemModel: sale.categories?.itemModel,
        itemType: sale.categories?.itemType,
        brand: sale.categories?.brand,
      },
      sellerDetails: {
        id: sale.sellerId,
        name: sale.actors?.name,
        email: sale.actors?.email,
      },
      financeDetails: {
        status: sale.financeStatus,
        amount: sale.financeAmount,
        financer: sale.financer,
      },
      shopDetails: {
        id: sale.shopID,
        name: sale.shops?.shopName,
        address: sale.shops?.address,
      },
      createdAt: sale.createdAt,
    };

    // Add table-specific properties
    return tableName === "mobilesales"
      ? {
          ...base,
          saleType: sale.salesType,
          productDetails: {
            ...base.productDetails,
            storage: sale.mobiles?.storage,
            color: sale.mobiles?.color,
          },
        }
      : {
          ...base,
          saleType: sale.financeStatus === "N/A" ? "direct" : "finance",
          productDetails: {
            ...base.productDetails,
            color: sale.accessories?.color,
            stockStatus: sale.accessories?.stockStatus,
          },
        };
  }
  async updateFinanceStatus({ salesTable, saleId, status }) {
    try {
      const salesModel = prisma[salesTable];
      if (!salesModel) {
        throw new APIError(
          "Not Found",
          STATUS_CODE.NOT_FOUND,
          "Invalid sale type specified."
        );
      }

      return await salesModel.update({
        where: { id: saleId },
        data: { financeStatus: status },
      });
    } catch (err) {
      if (err.code === "P2025") {
        throw new APIError(
          "Not Found",
          STATUS_CODE.NOT_FOUND,
          `Sale with ID ${saleId} not found.`
        );
      }
      console.error("Database error updating finance status:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to update finance status."
      );
    }
  }
}

export { Sales };
