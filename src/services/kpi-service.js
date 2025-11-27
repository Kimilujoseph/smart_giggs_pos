import { KpiRepository } from '../databases/repository/kpi-repository.js';

class KpiService {
  constructor() {
    this.repository = new KpiRepository();
  }

  /**
   * Retrieves seller performance KPIs based on provided filters.
   *
   * @param {object} filters - The filter criteria for fetching KPIs.
   * @returns {Promise<Array>} - A promise that resolves to an array of formatted KPI data.
   */
  async getSellerPerformance(filters) {
    try {
      const { kpis, total } = await this.repository.getSellerPerformance(filters);
      return { kpis, totalKpis: total };
    } catch (error) {
      console.error("Service error while fetching seller performance:", error);
      throw new Error("Failed to get seller performance data.");
    }
  }

  async getKpiAchievementReport(filters) {
    const { sellerId, startDate, endDate, period = 'daily' } = filters;

    const kpiTargets = {
      daily: { smartphones: 2, smallphones: 2, accessories: 3 },
      weekly: { smartphones: 12, smallphones: 12, accessories: 18 },
      monthly: { smartphones: 52, smallphones: 52, accessories: 78 },
    };

    const targets = kpiTargets[period.toLowerCase()];
    if (!targets) {
      throw new Error("Invalid period specified. Must be one of 'daily', 'weekly', 'monthly'.");
    }

    const salesData = await this.repository.getSalesForKpiReport({ sellerId, startDate, endDate });

    const actualSales = {
      smartphones: 0,
      smallphones: 0,
      accessories: 0,
    };

    salesData.forEach(sale => {
      if (actualSales.hasOwnProperty(sale.itemType)) {
        actualSales[sale.itemType] += sale.count;
      }
    });

    const report = {
      period,
      sellerId,
      startDate,
      endDate,
      targets,
      actualSales,
      achievement: {
        smartphones: actualSales.smartphones >= targets.smartphones,
        smallphones: actualSales.smallphones >= targets.smallphones,
        accessories: actualSales.accessories >= targets.accessories,
      },
    };

    report.overallAchievement = Object.values(report.achievement).every(Boolean);

    return report;
  }
}

export { KpiService };
