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
}

export { KpiService };
