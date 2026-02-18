import { AnalyticsService } from '../../services/analytics-service.js';
import { checkRole } from '../../helpers/authorisation.js';
import { handleResponse } from '../../helpers/responseUtils.js';
import { APIError, STATUS_CODE } from '../../Utils/app-error.js';

const analyticsService = new AnalyticsService();

const getTopProducts = async (req, res, next) => {
    try {

        const { metric, limit, startDate, endDate, financerId } = req.query;
        const data = await analyticsService.getTopProductsAnalytics({ metric, limit, startDate, endDate, financerId });

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


        const { startDate, endDate, financerId } = req.query;
        const data = await analyticsService.getShopPerformanceSummary({ startDate, endDate, financerId });

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
