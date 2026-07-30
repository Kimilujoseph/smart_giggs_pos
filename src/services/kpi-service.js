import { KpiRepository } from '../databases/repository/kpi-repository.js';
import { APIError } from '../Utils/app-error.js';

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



  async getKpiAchievementReport(summaryReport, period) {
    const {
      totalSmartphoneUnitsSold,
      totalSmallPhoneUnitsSold,
      totalAccessoryUnitsSold,
      totalSimCardUnitsSold
    } = summaryReport;
    //console.log("summaryPeriod", period)
    const { startDate, endDate } = period;
    //console.log("startDate", startDate)
    //console.log("endDate", endDate)
    const diffInDays =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    //console.log("diffInDays", diffInDays)
    let calculatedPeriod;

    if (diffInDays <= 1) {
      calculatedPeriod = "day";
    } else if (diffInDays <= 7) {
      calculatedPeriod = "week";
    } else if (diffInDays <= 30) {
      calculatedPeriod = "month";
    } else {
      calculatedPeriod = "custom";
    }
    //console.log("calculatedPeriod", calculatedPeriod)
    const kpiTargets = {
      day: {
        smartphones: 2,
        smallphones: 3,
        accessories: 3,
        simCard: 5,
      },
      week: {
        smartphones: 12,
        smallphones: 18,
        accessories: 18,
        simCard: 30,
      },
      month: {
        smartphones: 48,
        smallphones: 72,
        accessories: 72,
        simCard: 120,
      },

      custom: {
        smartphones: 48,
        smallphones: 72,
        accessories: 72,
        simCard: 120,
      },
    };

    const targets = kpiTargets[calculatedPeriod];

    const calculate = (actual, target) => ({
      target,
      actual,
      achievement: Number(((actual / target) * 100).toFixed(2)),
      achieved: actual >= target,
      remaining: Math.max(target - actual, 0),
    });

    const report = {
      smartphones: calculate(
        totalSmartphoneUnitsSold,
        targets.smartphones
      ),

      smallPhones: calculate(
        totalSmallPhoneUnitsSold,
        targets.smallphones
      ),

      accessories: calculate(
        totalAccessoryUnitsSold,
        targets.accessories
      ),

      simCards: calculate(
        totalSimCardUnitsSold,
        targets.simCard
      ),
    };

    // Overall KPI (weighted)
    const totalActual =
      totalSmartphoneUnitsSold +
      totalSmallPhoneUnitsSold +
      totalAccessoryUnitsSold +
      totalSimCardUnitsSold;

    const totalTarget =
      targets.smartphones +
      targets.smallphones +
      targets.accessories +
      targets.simCard;

    report.overall = {
      actual: totalActual,
      target: totalTarget,
      achievement: Number(
        ((totalActual / totalTarget) * 100).toFixed(2)
      ),
      achieved: totalActual >= totalTarget,
    };

    return report;
  }
}

export { KpiService };
