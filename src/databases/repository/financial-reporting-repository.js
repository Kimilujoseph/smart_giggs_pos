import { PrismaClient, Prisma } from "@prisma/client";
import {
  APIError,
  STATUS_CODE,
  InternalServerError,
} from "../../Utils/app-error.js";

const prisma = new PrismaClient();

class FinancialReportingRepository {
  async getAggregatedAnalytics({ startDate, endDate, type }) {
    try {
      const typeCondition =
        type === "returns"
          ? Prisma.sql`AND d.totalRevenue < 0`
          : Prisma.sql`AND d.totalRevenue > 0`;

      const result = await prisma.$queryRaw(
        Prisma.sql`
          SELECT
            SUM(d.totalRevenue) AS totalRevenue,
            SUM(d.grossProfit) AS grossProfit,
            SUM(d.totalCommission) AS totalCommission,
            SUM(d.totalCostOfGoods) AS totalCostOfGoods
          FROM DailySalesAnalytics d
          WHERE d.date >= ${startDate.toISOString().split("T")[0]}
            AND d.date < ${endDate.toISOString().split("T")[0]}
            ${typeCondition};
        `
      );
      //console.log("aggregated analytics%%%% result", result);

      return result;
    } catch (err) {
      console.error("Error in getAggregatedAnalytics:", err);
      throw new InternalServerError("Internal server error");
    }
  }

  async getLiveSales({ startDate, endDate }) {
    try {
      const mobileSales = await prisma.mobilesales.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: "COMPLETED",
        },
        _sum: {
          soldPrice: true,
          profit: true,
          commission: true,
          commissionPaid: true,
        },
      });
      console.log("@@@@ I have bit hit", mobileSales)
      const accessorySales = await prisma.accessorysales.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          soldPrice: true,
          profit: true,
          commission: true,
          commissionPaid: true,
        },
      });

      const [mobileResult, accessoryResult] = await Promise.all([
        mobileSales,
        accessorySales,
      ]);

      const totalRevenue =
        Number(mobileResult._sum.soldPrice || 0) +
        Number(accessoryResult._sum.soldPrice || 0);
      const grossProfit =
        Number(mobileResult._sum.profit || 0) +
        Number(accessoryResult._sum.profit || 0);
      return {
        totalRevenue,
        grossProfit,
        totalCommission:
          (mobileResult._sum.commission - mobileResult._sum.commissionPaid ||
            0) + (accessoryResult._sum.commission || 0),
        costOfGoodsSold: totalRevenue - grossProfit,
      };
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }

  async getExpenses({ startDate, endDate }) {
    try {
      //console.log("@@@@@@", startDate);
      return await prisma.expense.groupBy({
        by: ["category"],
        where: {
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
          status: "APPROVED",
        },
        _sum: {
          amount: true,
        },
      });
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }

  async getSalaries({ startDate, endDate }) {
    try {
      return await prisma.salaryPayment.aggregate({
        where: {
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "VOIDED",
          },
        },
        _sum: {
          amount: true,
        },
      });
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }

  async getCommissionPayments({ startDate, endDate }) {
    try {
      return await prisma.commissionPayment.aggregate({
        where: {
          paymentDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "VOIDED",
          },
        },
        _sum: {
          amountPaid: true,
        },
      });
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }

  async getAccountsReceivable() {
    try {
      const mobileReceivable = prisma.mobilesales.aggregate({
        where: {
          financeStatus: "pending",
        },
        _sum: {
          financeAmount: true,
        },
      });

      const accessoryReceivable = prisma.accessorysales.aggregate({
        where: {
          financeStatus: "pending",
        },
        _sum: {
          financeAmount: true,
        },
      });

      const [mobileResult, accessoryResult] = await Promise.all([
        mobileReceivable,
        accessoryReceivable,
      ]);

      return (
        (mobileResult._sum.financeAmount || 0) +
        (accessoryResult._sum.financeAmount || 0)
      );
    } catch (err) {
      throw new InternalServerError("Internal server error");
    }
  }
}

export default FinancialReportingRepository;
