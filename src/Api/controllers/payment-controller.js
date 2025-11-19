import PaymentService from "../../services/payment-service.js";
import { checkRole } from "../../helpers/authorisation.js";
import { handleError, handleResponse } from "../../helpers/responseUtils.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const paymentService = new PaymentService();

const handleGetPayments = async (req, res, next) => {
  try {
    const { user } = req;
    // Only allow managers and superusers to access this
    if (!checkRole(user.role, ["manager", "superuser"])) {
      throw new APIError(
        "Not authorized",
        STATUS_CODE.UNAUTHORIZED,
        "You are not authorized to view payments."
      );
    }

    const filters = { ...req.query, ...req.salesQuery };
    const { summary, payments, totalPayments, totalPages, currentPage } =
      await paymentService.getPayments(filters);

    handleResponse({
      res,
      message: "Payments retrieved successfully",
      data: {
        summary,
        payments,
        totalPayments,
        totalPages,
        currentPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

export { handleGetPayments };
