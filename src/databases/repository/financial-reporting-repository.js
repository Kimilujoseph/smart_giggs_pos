import { PrismaClient } from "@prisma/client";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const prisma = new PrismaClient();

class FinancialReportingRepository {

  async getAggregatedAnalytics({ startDate, endDate, type }) {
    try {
      const whereClause = {
        date: {
          gte: startDate,
          lt: endDate,
        },
      };

      if (type === 'sales') {
        whereClause.totalRevenue = { gt: 0 };
      } else if (type === 'returns') {
        whereClause.totalRevenue = { lt: 0 };
      }
      console.log("where clause for aggregated analytics", whereClause)

      return await prisma.dailySalesAnalytics.aggregate({
        where: whereClause,
        _sum: {
          totalRevenue: true,
          grossProfit: true,
          totalCommission: true,
          totalCostOfGoods: true,
        },
      });
    } catch (err) {

      throw new APIError("Database Error", STATUS_CODE.INTERNAL_ERROR, "Could not fetch aggregated sales analytics.");
    }
  }

  async getLiveSales({ startDate, endDate }) {
    try {
      const mobileSales = prisma.mobilesales.aggregate({
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
        },
      });

      const accessorySales = prisma.accessorysales.aggregate({
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
        },
      });

      const [mobileResult, accessoryResult] = await Promise.all([mobileSales, accessorySales]);

      const totalRevenue = Number(mobileResult._sum.soldPrice || 0) + Number(accessoryResult._sum.soldPrice || 0);
      const grossProfit = Number(mobileResult._sum.profit || 0) + Number(accessoryResult._sum.profit || 0);
      return {
        totalRevenue,
        grossProfit,
        totalCommission: (mobileResult._sum.commission || 0) + (accessoryResult._sum.commission || 0),
        costOfGoodsSold: totalRevenue - grossProfit,
      };
    } catch (err) {
      throw new APIError("Database Error", STATUS_CODE.INTERNAL_ERROR, "Could not fetch live sales.");
    }
  }

  async getExpenses({ startDate, endDate }) {
    try {
      return await prisma.expense.groupBy({
        by: ['category'],
        where: {
          expenseDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      });
    } catch (err) {
      throw new APIError("Database Error", STATUS_CODE.INTERNAL_ERROR, "Could not fetch expenses.");
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
            not: "VOIDED"
          }
        },
        _sum: {
          amount: true,
        },
      });
    } catch (err) {
      throw new APIError("Database Error", STATUS_CODE.INTERNAL_ERROR, "Could not fetch salaries.");
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
            not: "VOIDED"
          }
        },
        _sum: {
          amountPaid: true,
        },
      });
    } catch (err) {
      throw new APIError("Database Error", STATUS_CODE.INTERNAL_ERROR, "Could not fetch commission payments.");
    }
  }

  async getAccountsReceivable() {
    try {
      const mobileReceivable = prisma.mobilesales.aggregate({
        where: {
          financeStatus: 'pending',
        },
        _sum: {
          financeAmount: true,
        },
      });

      const accessoryReceivable = prisma.accessorysales.aggregate({
        where: {
          financeStatus: 'pending',
        },
        _sum: {
          financeAmount: true,
        },
      });

      const [mobileResult, accessoryResult] = await Promise.all([mobileReceivable, accessoryReceivable]);

      return (mobileResult._sum.financeAmount || 0) + (accessoryResult._sum.financeAmount || 0);
    } catch (err) {
      throw new APIError("Database Error", STATUS_CODE.INTERNAL_ERROR, "Could not fetch accounts receivable.");
    }
  }
}

export default FinancialReportingRepository;
