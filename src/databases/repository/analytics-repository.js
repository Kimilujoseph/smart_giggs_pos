import { PrismaClient, Prisma } from "@prisma/client";
import { APIError, STATUS_CODE, InternalServerError } from "../../Utils/app-error.js";

const prisma = new PrismaClient();

class AnalyticsRepository {
  async getSalesAnalytics({ startDate, endDate, shopId, sellerId, categoryId, financerId, financeStatus }) {
    try {
      //console.log("analytics query filters", startDate, endDate, shopId, sellerId, categoryId, financerId, financeStatus)
      const conditions = [
        Prisma.sql`d.date >= ${startDate}`,
        Prisma.sql`d.date <= ${endDate}`,
      ];

      if (shopId) {
        conditions.push(Prisma.sql`d.shopId = ${shopId}`);
      }

      if (sellerId) {
        conditions.push(Prisma.sql`d.sellerId = ${sellerId}`);
      }

      if (categoryId) {
        conditions.push(Prisma.sql`d.categoryId = ${categoryId}`);
      }

      if (financerId) {
        conditions.push(Prisma.sql`d.financeId = ${financerId}`);
      }

      if (financeStatus) {
        conditions.push(Prisma.sql`d.financeStatus = ${financeStatus}`);
      }

      // console.log("whre clause generated", whereClause)

      const result = await prisma.$queryRaw(
        Prisma.sql`
    SELECT
      c.category,
      SUM(d.totalUnitsSold) AS totalUnitsSold,
      SUM(d.totalRevenue) AS totalRevenue,
      SUM(d.grossProfit) AS grossProfit,
      SUM(d.totalCommission) AS totalCommission,
      SUM(d.totalfinanceAmount) AS totalfinanceAmount
    FROM DailySalesAnalytics d
    JOIN Categories c
      ON d.categoryId = c._id
    WHERE ${Prisma.join(conditions, " AND ")}
    GROUP BY c.category;
  `
      );
      console.log("sales results", result)

      return result
    } catch (err) {
      console.error("Analytics Repository Error:", err);
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve sales analytics"
      );
    }
  }

  async getAccountReceivableSummary(salesPayload) {
    try {
      //console.log("account receivable payload", salesPayload)
      const { startDate, endDate, shopId, financerId, sellerId, categoryId } = salesPayload
      console.log("analytics date", shopId, sellerId, categoryId, financerId, startDate, endDate)
      const conditions = [
        Prisma.sql`createdAt >= ${startDate}`,
        Prisma.sql`createdAt <= ${endDate}`,
      ];
      if (shopId) {
        conditions.push(Prisma.sql`shopId = ${shopId}`);
      }

      if (sellerId) {
        conditions.push(Prisma.sql`sellerId = ${sellerId}`);
      }

      if (categoryId) {
        conditions.push(Prisma.sql`categoryId = ${categoryId}`);
      }

      if (financerId) {
        conditions.push(Prisma.sql`financerId = ${financerId}`);
      }


      conditions.push(Prisma.sql`financeStatus = 'pending'`);


      const summary = await prisma.$queryRaw`
        SELECT 
         SUM(soldPrice) AS totalFinanceAmount
        FROM mobilesales 
        WHERE ${Prisma.join(conditions, " AND ")}

      `

      return summary
    }
    catch (err) {
      console.log(err)
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve account receivable summary"
      )
    }
  }

  async getFinancerCommissionSummary(salesPayload) {
    try {
      const { startDate, endDate, shopId, financerId, sellerId, categoryId } = salesPayload
      console.log("analytics date", shopId, sellerId, categoryId, financerId, startDate, endDate)
      const conditions = [
        Prisma.sql`createdAt >= ${startDate}`,
        Prisma.sql`createdAt <= ${endDate}`,
      ];

      if (shopId) {
        conditions.push(Prisma.sql`shopId = ${shopId}`)
      }

      if (sellerId) {
        conditions.push(Prisma.sql`sellerId = ${sellerId}`)
      }

      if (categoryId) {
        conditions.push(Prisma.sql`categoryId = ${categoryId}`)
      }

      if (financerId) {
        conditions.push(Prisma.sql`financerId = ${financerId}`)
      }

      const summary = await prisma.$queryRaw`
        SELECT 
         SUM(commissionPaid) AS totalCommissionPaid,
         SUM(commission - commissionPaid) AS totalCommissionPending
        FROM mobilesales 
        WHERE ${Prisma.join(conditions, " AND ")}

      `

      return summary
    }
    catch (err) {
      //console.log(err)
      throw new APIError(
        "Database Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to retrieve financer commission summary"
      )
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
      // console.error("Analytics Repository Error:", err);
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
      //console.error("Analytics Repository Error:", err);
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
      //  console.error("Analytics Repository Error:", err);
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
