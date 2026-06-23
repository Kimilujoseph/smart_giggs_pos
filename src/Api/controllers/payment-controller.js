import PaymentService from "../../services/payment-service.js";
import { handleError, handleResponse } from "../../helpers/responseUtils.js";

const paymentService = new PaymentService();

const handleGetPayments = async (req, res, next) => {
  try {
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
