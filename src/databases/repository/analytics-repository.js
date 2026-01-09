import { PrismaClient } from "@prisma/client";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const prisma = new PrismaClient();

class AnalyticsRepository {
  async getSalesAnalytics({ startDate, endDate, shopId, sellerId, categoryId, financerId, financeStatus }) {
    try {
      const whereClause = {
        date: {
          gte: startDate,
          lt: endDate,
        },
      };

      if (shopId) {
        whereClause.shopId = shopId;
      }
      if (sellerId) {
        whereClause.sellerId = sellerId;
      }
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }
      if (financerId) {
        whereClause.financeId = financerId;
      }
      if (financeStatus) {
        whereClause.financeStatus = financeStatus;
      }

      console.log("whre clause generated", whereClause)

      const result = await prisma.dailySalesAnalytics.aggregate({
        where: whereClause,
        _sum: {
          totalUnitsSold: true,
          totalRevenue: true,
          grossProfit: true,
          totalCommission: true,
          totalfinanceAmount: true,
        },
      });

      return {
        totalUnitsSold: Number(result._sum.totalUnitsSold) || 0,
        totalRevenue: Number(result._sum.totalRevenue) || 0,
        grossProfit: Number(result._sum.grossProfit) || 0,
        totalCommission: Number(result._sum.totalCommission) || 0,
        totalfinanceAmount: Number(result._sum.totalfinanceAmount) || 0,
      };
    } catch (err) {
      console.error("Analytics Repository Error:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve sales analytics"
      );
    }
  }
  async getTopProducts({ metric = 'revenue', limit = 10, startDate, endDate }) {
    try {
      const validMetrics = {
        profit: 'grossProfit',
        revenue: 'totalRevenue',
        units: 'totalUnitsSold',
      };

      const metricField = validMetrics[metric] || 'totalRevenue';

      const whereClause = {};
      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lt: new Date(endDate),
        };
      }

      const results = await prisma.dailySalesAnalytics.groupBy({
        by: ['categoryId'],
        where: whereClause,
        _sum: {
          grossProfit: true,
          totalRevenue: true,
          totalUnitsSold: true,
        },
        orderBy: {
          _sum: {
            [metricField]: 'desc',
          },
        },
        take: Number(limit),
      });

      return results;
    } catch (err) {
      console.error("Analytics Repository Error:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve top products analytics"
      );
    }
  }

  async getShopPerformanceSummary({ startDate, endDate }) {
    try {
      const whereClause = {};
      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lt: new Date(endDate),
        };
      }

      const results = await prisma.dailySalesAnalytics.groupBy({
        by: ['shopId'],
        where: whereClause,
        _sum: {
          totalRevenue: true,
          grossProfit: true,
          totalUnitsSold: true,
          totalCommission: true,
          totalfinanceAmount: true,
        },
        orderBy: {
          _sum: {
            totalRevenue: 'desc',
          },
        },
      });

      return results;
    } catch (err) {
      console.error("Analytics Repository Error:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve shop performance summary"
      );
    }
  }

  async getSalesByStatus({ startDate, endDate, status }) {
    try {
      const whereClause = {};
      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lt: new Date(endDate),
        };
      }

      if (status) {
        whereClause.financeStatus = status;
      }

      const results = await prisma.dailySalesAnalytics.groupBy({
        by: ['financeStatus'],
        where: whereClause,
        _sum: {
          totalRevenue: true,
          grossProfit: true,
          totalUnitsSold: true,
          totalCommission: true,
          totalfinanceAmount: true,
        },
        orderBy: {
          _sum: {
            totalRevenue: 'desc',
          },
        },
      });

      return results;
    } catch (err) {
      console.error("Analytics Repository Error:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve sales by status summary"
      );
    }
  }

  async getSalesByFinancer({ startDate, endDate, financeID }) {
    try {
      const whereclause = {
        date: {
          gte: new Date(startDate),
          lt: new Date(endDate),
        },
        ...(financeID && { financeID })
      }
      const financeResult = await prisma.dailySalesAnalytics.groupBy({
        by: ['financeId'],
        where: whereclause,
        _sum: {
          totalRevenue: true,
          grossProfit: true,
          totalUnitsSold: true,
          totalCommission: true,
          totalfinanceAmount: true,
        },
        orderBy: {
          _sum: {
            totalRevenue: 'desc',
          },
        }

      })
      return financeResult
    }
    catch (err) {
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve sales by financer"
      );
    }
  }
}

export { AnalyticsRepository };
