import { KpiService } from '../../services/kpi-service.js';
import {
  handleError,
  handleSalesResponse,
} from "../../helpers/responseUtils.js";

const kpiService = new KpiService();


export const getSellerPerformance = async (req, res) => {
  try {

    const filters = {
      ...req.query,
      startDate: req.salesQuery.startDate,
      endDate: req.salesQuery.endDate,

    };

    const kpis = await kpiService.getSellerPerformance(filters);


    handleSalesResponse(res, {
      sales: kpis,
      page: req.salesQuery.page,
      limit: req.salesQuery.limit,
      total: kpis.length
    });

  } catch (error) {
    console.error("Controller error in getSellerPerformance:", error);
    handleError(res, "internal server error");
  }
};
