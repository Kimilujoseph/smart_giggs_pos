import FinancialReportingRepository from "../databases/repository/financial-reporting-repository.js";
import { APIError, STATUS_CODE } from "../Utils/app-error.js";

class FinancialReportingService {
  constructor() {
    this.repository = new FinancialReportingRepository();
  }

  async generateFinancialSummary({ startDate, endDate }) {
    try {
      let historicalSalesData = [];
      let historicalReturnsData = [];

      const start = startDate;
      const end = endDate;

      if (start) {
        historicalSalesData = await this.repository.getAggregatedAnalytics({
          startDate: start,
          endDate: end,
          type: "sales",
        });

        historicalReturnsData = await this.repository.getAggregatedAnalytics({
          startDate: start,
          endDate: end,
          type: "returns",
        });
      }

      const sales = historicalSalesData?.[0] || {};
      const returns = historicalReturnsData?.[0] || {};

      const totalSales = Number(sales.totalRevenue || 0);
      // In DailySalesAnalytics, returns have negative revenue (or null if none)
      const returnsRevenue = Number(returns.totalRevenue || 0);
      const totalReturns = Math.abs(returnsRevenue);
      const netRevenue = totalSales - totalReturns;

      const grossProfit =
        Number(sales.grossProfit || 0) + Number(returns.grossProfit || 0);
      const accruedCommission =
        Number(sales.totalCommission || 0) + Number(returns.totalCommission || 0);
      const costOfGoodsSold =
        Number(sales.totalCostOfGoods || 0) + Number(returns.totalCostOfGoods || 0);

      const expensesData = await this.repository.getExpenses({
        startDate: start,
        endDate: end,
      });
      const salariesData = await this.repository.getSalaries({
        startDate: start,
        endDate: end,
      });
      const commissionData = await this.repository.getCommissionPayments({
        startDate: start,
        endDate: end,
      });

      const accountsReceivable = await this.repository.getAccountsReceivable();

      const paidCommissions = Number(commissionData?._sum?.amountPaid) || 0;
      const paidSalaries = Number(salariesData?._sum?.amount) || 0;
      const commissionRemaining = Number(accruedCommission - paidCommissions);
      const remainingCommission = commissionRemaining > 0 ? commissionRemaining : 0;
      const operatingExpenses = {
        commissions: paidCommissions,
        salaries: paidSalaries,
      };

      let totalOtherExpenses = 0;
      expensesData.forEach((exp) => {
        const category = exp.category.toLowerCase();
        const amount = Number(exp?._sum?.amount) || 0;
        operatingExpenses[category] = amount;
        totalOtherExpenses += amount;
      });

      const totalOperatingExpenses =
        paidCommissions + paidSalaries + totalOtherExpenses;
      const netOperatingIncome = grossProfit - totalOperatingExpenses;

      return {
        reportPeriod: {
          startDate,
          endDate,
        },
        incomeStatement: {
          totalSales,
          totalReturns,
          netRevenue,
          costOfGoodsSold: Number(costOfGoodsSold),
          grossProfit,
          accruedCommission: Number(remainingCommission),
          operatingExpenses: {
            ...operatingExpenses,
            totalOperatingExpenses,
          },
          netOperatingIncome,
        },
        balanceSheetMetrics: {
          accountsReceivable: Number(accountsReceivable),
        },
      };
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Failed to generate financial summary."
      );
    }
  }
}

export default FinancialReportingService;
