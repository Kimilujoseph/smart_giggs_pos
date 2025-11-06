import FinancialReportingRepository from "../databases/repository/financial-reporting-repository.js";
import { APIError, STATUS_CODE } from "../Utils/app-error.js";

class FinancialReportingService {
  constructor() {
    this.repository = new FinancialReportingRepository();
  }

  async generateFinancialSummary({ startDate, endDate }) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let historicalSalesData = { _sum: { totalRevenue: 0, grossProfit: 0, totalCommission: 0, totalCostOfGoods: 0 } };
      let historicalReturnsData = { _sum: { totalRevenue: 0, grossProfit: 0, totalCommission: 0, totalCostOfGoods: 0 } };
      let todayData = { totalRevenue: 0, grossProfit: 0, totalCommission: 0, costOfGoodsSold: 0 };

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start < today) {
        const historicalEndDate = end < today ? end : today;
        historicalSalesData = await this.repository.getAggregatedAnalytics({
          startDate: start,
          endDate: historicalEndDate,
          type: 'sales',
        });
        historicalReturnsData = await this.repository.getAggregatedAnalytics({
          startDate: start,
          endDate: historicalEndDate,
          type: 'returns',
        });
      }

      if (end >= today) {
        const liveStartDate = start > today ? start : today;
        todayData = await this.repository.getLiveSales({ startDate: liveStartDate, endDate: end });
      }

      const totalSales = Number(historicalSalesData._sum.totalRevenue || 0) + Number(todayData.totalRevenue);
      const totalReturns = Number(historicalReturnsData._sum.totalRevenue || 0);
      const netRevenue = totalSales + totalReturns;

      const grossProfit = Number(historicalSalesData._sum.grossProfit || 0) + Number(historicalReturnsData._sum.grossProfit || 0) + Number(todayData.grossProfit);
      const accruedCommission = Number(historicalSalesData._sum.totalCommission || 0) + Number(historicalReturnsData._sum.totalCommission || 0) + Number(todayData.totalCommission);

      const expensesData = await this.repository.getExpenses({ startDate: start, endDate: end });
      const salariesData = await this.repository.getSalaries({ startDate: start, endDate: end });
      const commissionData = await this.repository.getCommissionPayments({ startDate: start, endDate: end });
      const accountsReceivable = await this.repository.getAccountsReceivable();

      const paidCommissions = Number(commissionData._sum.amountPaid) || 0;
      const paidSalaries = Number(salariesData._sum.amount) || 0;

      const operatingExpenses = {
        commissions: paidCommissions,
        salaries: paidSalaries,
      };

      let totalOtherExpenses = 0;
      expensesData.forEach(exp => {
        const category = exp.category.toLowerCase();
        const amount = Number(exp._sum.amount) || 0;
        operatingExpenses[category] = amount;
        totalOtherExpenses += amount;
      });

      const totalOperatingExpenses = paidCommissions + paidSalaries + totalOtherExpenses;
      const netOperatingIncome = grossProfit - totalOperatingExpenses;

      const costOfGoodsSold =
        Number(historicalSalesData._sum.totalCostOfGoods || 0) +
        Number(historicalReturnsData._sum.totalCostOfGoods || 0) +
        Number(todayData.costOfGoodsSold);

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
          accruedCommission,
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
      throw new APIError("Service Error", STATUS_CODE.INTERNAL_ERROR, "Failed to generate financial summary.");
    }
  }
}

export default FinancialReportingService;
