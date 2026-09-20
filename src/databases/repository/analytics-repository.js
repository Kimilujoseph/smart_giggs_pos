import { PrismaClient, Prisma } from "@prisma/client";
import { APIError, STATUS_CODE, InternalServerError } from "../../Utils/app-error.js";
import { getSalesPermissions } from "../../helpers/sales-permissions.js";

const prisma = new PrismaClient();

// Helper: format a Date as YYYY-MM-DD in LOCAL time (not UTC).
// Using .toISOString() would shift midnight local time back one day in UTC+N timezones.
const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

class AnalyticsRepository {
  async getSalesAnalytics({ startDate, endDate, shopId, sellerId, categoryId, financerId, financeStatus, userRole }) {
    try {
      const startDateStr = toLocalDateString(startDate);
      const endDateStr = toLocalDateString(endDate);
      console.log("analytics query filters", startDateStr, endDateStr, shopId, sellerId, categoryId, financerId, financeStatus)
      const conditions = [
        Prisma.sql`d.date >= ${startDateStr}`,
        Prisma.sql`d.date <= ${endDateStr}`,
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

      const permissions = getSalesPermissions(userRole);
      // if (!permissions.canViewConsignmentSoldPrice) {
      //   conditions.push(Prisma.sql`d.isConsignment = false`);
      // }
     const selectFields = [
                Prisma.sql`c.itemType`,
                Prisma.sql`SUM(d.totalUnitsSold) AS totalUnitsSold`,
                Prisma.sql`SUM(d.totalRevenue) AS totalRevenue`,
                Prisma.sql`SUM(d.grossProfit) AS grossProfit`,
                Prisma.sql`SUM(d.totalfinanceAmount) AS totalfinanceAmount`,
              ];

              if (!permissions.canViewConsignmentSoldPrice) {
                selectFields.push(Prisma.sql`SUM(CASE WHEN d.isConsignment = false THEN d.totalRevenue ELSE 0 END) AS totalRevenue`);
              }

if (permissions.canViewCommission) {
  selectFields.push(
    Prisma.sql`SUM(d.totalCommission) AS totalCommission`
  );
}

const result = await prisma.$queryRaw(
  Prisma.sql`
    SELECT
      ${Prisma.join(selectFields, ", ")}
    FROM DailySalesAnalytics d
    JOIN categories c
      ON d.categoryId = c._id
    WHERE ${Prisma.join(conditions, " AND ")}
    GROUP BY c.itemType;
  `
);

      // Apply role-based field masking on the result set
      return result.map((row) => ({
        ...row,
        grossProfit: permissions.canViewProfit ? row.grossProfit : 0,
      }));

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
         SUM(financeAmount) AS totalFinanceAmount
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


  async getTopProducts({ startDate, endDate }) {

    try {
      let limit = 10;

      const results = await prisma.$queryRaw`
SELECT
    c._id,
    c.itemName,
    c.brand,
    SUM(d.totalUnitsSold) AS totalUnitsSold,
    SUM(d.totalRevenue) AS totalRevenue,
    SUM(d.grossProfit) AS grossProfit
FROM DailySalesAnalytics d
JOIN categories c
    ON d.categoryId = c._id
WHERE d.date >= ${toLocalDateString(startDate)}
  AND d.date <= ${toLocalDateString(endDate)}
GROUP BY d.categoryId
ORDER BY totalRevenue DESC
LIMIT ${limit}
`;

      //console.log("resu@@lts", JSON.stringify(results))
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
      const results = await prisma.$queryRaw`
SELECT
    d.shopId,
    c.itemType,
    s.shopName,
    SUM(d.totalRevenue) AS totalRevenue,
    SUM(d.grossProfit) AS grossProfit,
    SUM(d.totalUnitsSold) AS totalUnitsSold,
    SUM(d.totalCommission) AS totalCommission,
    SUM(d.totalfinanceAmount) AS totalFinanceAmount

FROM  DailySalesAnalytics d
INNER JOIN categories c
    ON d.categoryId = c._id
INNER JOIN shops s 
    ON d.shopId = s._id
    WHERE d.date >= ${toLocalDateString(startDate)} AND d.date <= ${toLocalDateString(endDate)}

GROUP BY
    d.shopId,
    c.itemType,
    s.shopName

ORDER BY
    totalRevenue DESC;
`;

      // console.log("sql result", results)

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
