import { KpiService } from '../../services/kpi-service.js';
import {
  handleError,
  handleResponse,
} from "../../helpers/responseUtils.js";

const kpiService = new KpiService();


export const getSellerPerformance = async (req, res) => {
  try {

    const { id: userId, role } = req.user;
    const { sellerId } = req.query;

    // If a sellerId is provided, check for authorization
    if (sellerId && userId.toString() !== sellerId && role !== 'superuser') {
      return handleError(res, "Forbidden: You are not authorized to view this seller's performance", 403);
    }

    const filters = {
      ...req.query,
      startDate: req.salesQuery.startDate,
      endDate: req.salesQuery.endDate,
      page: req.salesQuery.page,
      limit: req.salesQuery.limit,
    };

    // Normalize the 'period' query parameter to be case-insensitive
    if (req.query.Period && !req.query.period) {
      filters.period = req.query.Period;
      delete filters.Period;
    }

    // If no sellerId is provided, and the user is not a superuser, default to the user's own ID
    if (!sellerId && role !== 'superuser') {
      filters.sellerId = userId;
    }

    const { kpis, totalKpis } = await kpiService.getSellerPerformance(filters);
    //console.log("KPIs retrieved:", kpis);

    handleResponse({
      res,
      data: {
        sales: kpis,
        page: req.salesQuery.page,
        limit: req.salesQuery.limit,
        total: totalKpis,
      },
    });
  } catch (error) {
    console.error("Controller error in getSellerPerformance:", error);
    handleError(res, "internal server error");
  }
};
