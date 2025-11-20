import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";
const prisma = new PrismaClient();
class Sales {
  async createPayment(paymentData) {
    try {
      const payment = await prisma.payment.create({
        data: {
          ...paymentData,
          financerId: paymentData.financerId,
        },
      });
      return payment;
    } catch (err) {
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async createnewMobilesales(salesDetails) {
    try {
      const successfullsale = await prisma.mobilesales.create({
        data: {
          ...salesDetails,
        },
      });
      return successfullsale;
    } catch (err) {
      console.log("creating sales error ", err);
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async createnewAccessoriesales(salesDetails) {
    try {
      const successfullsale = await prisma.accessorysales.create({
        data: {
          ...salesDetails,
        },
      });
      return successfullsale;
    } catch (err) {
      console.log("creating sales error ", err);
      throw new APIError(
        "database error",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }
  async findSalesById(salesId) {
    try {
      const sales = await salesDatabase.findById(salesId).populate({
        path: "CategoryId",
        select: "itemModel itemName,brand",
      });

      if (!sales) {
        throw new APIError(
          "database error".STATUS_CODE.NOT_FOUND,
          "sales not found"
        );
      }
      //console.log("@@", sales);
      return sales;
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
  async findSales({ salesTable, startDate, endDate, page, limit, shopId, categoryId, userId, financerId, financeStatus }) {
    try {
      const salesModel = prisma[salesTable];
      const skip = (page - 1) * limit;
      const whereClause = {
        createdAt: { gte: startDate, lte: endDate },
      };
      if (userId) {
        whereClause.sellerId = userId
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
                shopName: true
              }
            },
            categories: {
              select: {
                itemName: true,
                itemModel: true,
                itemType: true,
                brand: true
              }
            },
            actors: {
              select: {
                id: true,
                name: true
              }
            },
            Financer: {
              select: {
                name: true
              }
            },
            //Payment: true
          }
          : {
            accessories: true,
            shops: {
              select: {
                shopName: true
              }
            },
            categories: {
              select: {
                itemName: true,
                itemModel: true,
                itemType: true,
                brand: true
              }
            },
            actors: {
              select: {
                id: true,
                name: true
              }
            },
            Financer: {
              select: {
                name: true
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
      console.error("Database error:", err);
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

  async findUserSales({ salesTable, userId, startDate, endDate, page, limit, financerId, financeStatus }) {
    try {
      const salesModel = prisma[salesTable];
      const skip = (page - 1) * limit
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
                shopName: true
              }
            },
            categories: {
              select: {
                itemName: true,
                itemModel: true,
                itemType: true,
                brand: true
              }
            },
            actors: {
              select: {
                id: true,
                name: true
              }
            },
            Financer: {
              select: {
                name: true
              }
            },
            //Payment: true
          }
          : {
            accessories: true,
            shops: {
              select: {
                shopName: true
              }
            },
            categories: {
              select: {
                itemName: true,
                itemModel: true,
                itemType: true,
                brand: true
              }
            },
            actors: {
              select: {
                id: true,
                name: true
              }
            },
            Financer: {
              select: {
                name: true
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
      console.log("total profit", totals._sum.profit)
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
    return prisma.sales.findMany({
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
  // sales.repository.js

  async getSalesAnalytics(salesTable, startDate, endDate) {
    try {
      return await prisma.$queryRaw(
        Prisma.sql`
        SELECT 
          p.itemName AS "productName",
          CAST(SUM(s.soldprice) AS SIGNED) AS "totalSales",
          CAST(SUM(s.profit) AS SIGNED) AS "netprofit",
          CAST(COUNT(s._id) AS SIGNED) AS "totaltransacted"
        FROM ${Prisma.raw(salesTable)} s
        JOIN categories p ON s.categoryId = p._id
        WHERE s.createdat BETWEEN ${startDate} AND ${endDate}
          AND s.financestatus != 'pending'
        GROUP BY p.itemName
        ORDER BY "totalSales" DESC
        LIMIT 10
      `
      );
    } catch (err) {
      console.log("#$#$sales", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve product analytics"
      );
    }
  }

  async getSellerAnalytics(salesTable, startDate, endDate) {
    try {
      return await prisma.$queryRaw(
        Prisma.sql`
        SELECT 
          a.name AS "sellerName",
          CAST(SUM(s.soldprice) AS SIGNED) AS "totalSales",
          CAST(SUM(s.profit) AS SIGNED) AS "netprofit",
          CAST(COUNT(s._id) AS SIGNED) AS "totaltransacted"
        FROM ${Prisma.raw(salesTable)} s
        JOIN actors a ON s.sellerid = a._id
        WHERE s.createdat BETWEEN ${startDate} AND ${endDate}
          AND s.financestatus != 'pending'
        GROUP BY a.name
        ORDER BY "totalSales" DESC
        LIMIT 10
      `
      );
    } catch (err) {
      console.log("#$#$", err);
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve seller analytics"
      );
    }
  }
  async getUserSellerAnalytics(salesTable, userId, startDate, endDate) {
    try {
      return await prisma.$queryRaw(
        Prisma.sql`
        SELECT 
          a.name AS "sellerName",
          CAST(SUM(s.soldprice) AS SIGNED) AS "totalSales",
          CAST(SUM(s.profit) AS SIGNED) AS "netprofit",
          CAST(COUNT(s._id) AS SIGNED) AS "totaltransacted"
        FROM ${Prisma.raw(salesTable)} s
        JOIN actors a ON s.sellerid = a._id
        WHERE s.sellerid = ${userId}
          AND s.createdat BETWEEN ${startDate} AND ${endDate}
          AND s.financestatus != 'pending'
        GROUP BY a.name
        ORDER BY "totalSales" DESC
        LIMIT 10
      `
      );
    } catch (err) {
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Analytics failed"
      );
    }
  }
  async getUserProductAnalytics(salesTable, userId, startDate, endDate) {
    try {
      return await prisma.$queryRaw(
        Prisma.sql`
        SELECT 
          p.itemName AS "productName",
          CAST(SUM(s.soldprice) AS SIGNED) AS "totalSales",
          CAST(SUM(s.profit) AS SIGNED) AS "netprofit",
          CAST(COUNT(s._id) AS SIGNED) AS "totaltransacted"
        FROM ${Prisma.raw(salesTable)} s
        JOIN categories p ON s.categoryId = p._id
        WHERE s.sellerid = ${userId}
          AND s.createdat BETWEEN ${startDate} AND ${endDate}
          AND s.financestatus != 'pending'
        GROUP BY p.itemName
        ORDER BY "totalSales" DESC
        LIMIT 10
      `
      );
    } catch (err) {
      throw new APIError(
        "Database error",
        STATUS_CODE.INTERNAL_ERROR,
        "Analytics failed"
      );
    }
  }

  async updateFinanceStatus({ salesTable, saleId, status }) {
    try {
      const salesModel = prisma[salesTable];
      if (!salesModel) {
        throw new APIError("Not Found", STATUS_CODE.NOT_FOUND, "Invalid sale type specified.");
      }

      return await salesModel.update({
        where: { id: saleId },
        data: { financeStatus: status },
      });
    } catch (err) {
      if (err.code === 'P2025') {
        throw new APIError("Not Found", STATUS_CODE.NOT_FOUND, `Sale with ID ${saleId} not found.`);
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
