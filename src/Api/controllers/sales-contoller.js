import { salesmanagment } from "../../services/sales-services.js";
import { checkRole } from "../../helpers/authorisation.js";
import { handleError, handleResponse } from "../../helpers/responseUtils.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const salesService = new salesmanagment();

const handleGetSales = async (req, res, next) => {
  try {
    const { user, salesQuery } = req;
    const { shopId, categoryId, userId, financerId } = req.params;
    const { model } = req.query;
    let serviceMethod;
    const servicePayload = { ...salesQuery, ...req.query };
    console.log("payload from req", servicePayload)


    console.log("console .log", servicePayload)

    if (shopId) {
      if (!checkRole(user.role, ["manager", "superuser"])) {
        throw new APIError(
          "Not authorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to view shop sales."
        );
      }
      serviceMethod = "generateShopSales";
      servicePayload.shopId = parseInt(shopId, 10);
    } else if (categoryId) {
      if (!checkRole(user.role, ["manager", "superuser"])) {
        throw new APIError(
          "Not authorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to view category sales."
        );
      }
      serviceMethod = "generateCategorySales";
      servicePayload.categoryId = parseInt(categoryId, 10);
    } else if (userId) {
      const parsedUserId = parseInt(userId, 10);
      if (
        !checkRole(user.role, ["manager", "superuser"]) &&
        user.id !== parsedUserId
      ) {
        throw new APIError(
          "Not authorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to view this user's sales."
        );
      }
      serviceMethod = "getUserSales";
      servicePayload.userId = parsedUserId;
    } else if (financerId) {
      if (!checkRole(user.role, ["manager", "superuser"])) {
        throw new APIError(
          "Not authorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to view financer sales."
        );
      }
      serviceMethod = "generateFinancerSales";
      servicePayload.financerId = parseInt(financerId, 10);
    } else {
      if (!checkRole(user.role, ["manager", "superuser"])) {
        throw new APIError(
          "Not authorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to view general sales."
        );
      }
      serviceMethod = "generategeneralsales";
    }

    const report = await salesService[serviceMethod](servicePayload);

    if (!report || (Array.isArray(report) && report.length === 0)) {
      throw new APIError(
        "No sales found",
        STATUS_CODE.NOT_FOUND,
        "No sales found for the given criteria."
      );
    }

    const finalReport = Array.isArray(report) ? report[0] : report;
    const { sales, analytics } = finalReport;

    handleResponse({
      res,
      message: "Sales data retrieved successfully",
      data: {
        analytics: analytics || {},
        sales: sales?.sales || [],
        //salesPerMonth: sales?.salesPerMonth || [],
        totalSales: sales?.totalSales || 0,
        totalProfit: sales?.totalProfit || 0,
        totalCommission: sales?.totalCommission || 0,
        ///totalCommissionPaid: sales?.totalCommissionPaid || 0,
        //totalfinancePending: sales?.financeSales || 0,
        totalPages: sales?.totalPages || 1,
        currentPage: sales?.currentPage || 1,
        itemsPerPage: salesQuery.limit,
      },
    });
  } catch (err) {
    next(err); // Pass errors to the global error handler
  }
};

const handleSummarySales = async (req, res, next) => {
  try {
    const { user, salesQuery } = req;

    const salesQueryPayLoad = { ...salesQuery, ...req.query }
    console.log("payload", salesQueryPayLoad);
    const salesAnaytics = await salesService._getSummarySalesData(salesQueryPayLoad)
    console.log(salesAnaytics);
    handleResponse({
      res,
      message: "Sales summary retrieved successfully",
      data: salesAnaytics,
    })

  } catch (err) {
    next(err)
  }
}

const handleBulkSale = async (req, res, next) => {
  try {
    const { user } = req;
    const { ...salePayload } = req.body;
    console.log("Received bulk sale payload:", JSON.stringify(salePayload));
    const results = await salesService.createBulkSale(salePayload, user);
    // console.log("Bulk sale results:", results);

    handleResponse({
      res,
      message: "Bulk sale processed successfully",
      data: results.map((r) => r.value),
    });
  } catch (err) {
    next(err);
  }
};

const handleUpdateFinanceStatus = async (req, res, next) => {
  try {
    const { saleType, saleId } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new APIError(
        "Bad Request",
        STATUS_CODE.BAD_REQUEST,
        "Status is a required field."
      );
    }
    if (!["mobile", "accessory"].includes(saleType)) {
      throw new APIError(
        "Bad Request",
        STATUS_CODE.BAD_REQUEST,
        "Invalid sale type in URL."
      );
    }

    const result = await salesService.updateFinanceStatus({
      saleType,
      saleId,
      status,
    });

    handleResponse({
      res,
      message: result.message,
      data: result.sale,
    });
  } catch (err) {
    next(err);
  }
};

export { handleGetSales, handleBulkSale, handleUpdateFinanceStatus, handleSummarySales };
