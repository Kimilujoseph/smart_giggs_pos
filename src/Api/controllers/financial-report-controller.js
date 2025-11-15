import FinancialReportingService from "../../services/financial-reporting-service.js";
import { handleError, handleResponse } from "../../helpers/responseUtils.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const financialReportingService = new FinancialReportingService();

const handleGetFinancialSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.dateQuery;

    const summary = await financialReportingService.generateFinancialSummary({ startDate, endDate });
    //console.log("Financial Summary:", summary);
    handleResponse({
      res,
      message: "Financial summary retrieved successfully",
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

export { handleGetFinancialSummary };
