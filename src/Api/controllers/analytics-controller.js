import { AnalyticsService } from '../../services/analytics-service.js';
import { checkRole } from '../../helpers/authorisation.js';
import { handleResponse } from '../../helpers/responseUtils.js';
import { APIError, STATUS_CODE } from '../../Utils/app-error.js';

const analyticsService = new AnalyticsService();

const getTopProducts = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.dateQuery;
        const data = await analyticsService.getTopProductsAnalytics({ startDate, endDate });

        handleResponse({
            res,
            message: "Top products analytics retrieved successfully",
            data,
        });
    } catch (err) {
        next(err);
    }
};

const getShopPerformanceSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.dateQuery;
        //console.log("startDate", startDate)
        const data = await analyticsService.getShopPerformanceSummary({ startDate, endDate });

        handleResponse({
            res,
            message: "Shop performance summary retrieved successfully",
            data,
        });
    } catch (err) {
        next(err);
    }
};

const getSalesByStatus = async (req, res, next) => {
    try {

        const { startDate, endDate, status, financerId } = req.query;
        const data = await analyticsService.getSalesByStatus({ startDate, endDate, status, financerId });

        handleResponse({
            res,
            message: "Sales by status summary retrieved successfully",
            data,
        });
    } catch (err) {
        next(err);
    }
};

export { getTopProducts, getShopPerformanceSummary, getSalesByStatus };
