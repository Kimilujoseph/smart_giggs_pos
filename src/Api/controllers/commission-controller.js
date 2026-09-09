import { CommissionService } from '../../services/commission-service.js';
import { handleResponse } from '../../helpers/responseUtils.js';
import { checkRole } from '../../helpers/authorisation.js';
import { APIError, STATUS_CODE,AuthorizationError } from '../../Utils/app-error.js';

const commissionService = new CommissionService();

const handleCreateCommissionPayment = async (req, res, next) => {
  try {
    if (!checkRole(req.user.role, ['manager', 'superuser'])) {
      throw new APIError("Not authorized", STATUS_CODE.UNAUTHORIZED, "You are not authorized to create commission payments.");
    }

    const paymentData = {
      ...req.body,
      processedById: req.user.id,
    };

    const result = await commissionService.createCommissionPayment(paymentData);

    handleResponse({
      res,
      statusCode: 201,
      message: "Commission payment created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetCommissionPayments = async (req, res, next) => {
  try {
    const { user } = req;
    const { page = 1, limit = 10, sellerId: querySellerId, employeeId: queryEmployeeId } = req.query;
    const { startDate, endDate } = req.dateQuery;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      startDate,
      endDate,
    };

    const sellerId = querySellerId || queryEmployeeId;

    if (sellerId) {
      const requestedSellerId = parseInt(sellerId, 10);
      if (!checkRole(user.role, ['manager', 'superuser']) && user.id !== requestedSellerId) {
        throw new AuthorizationError("You are not authorized to view this seller's commission payments.");
      }
      else {
        options.sellerId = requestedSellerId;
      }
    }

    const result = await commissionService.getCommissionPayments(options);

    handleResponse({
      res,
      message: "Commission payments retrieved successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleVoidCommissionPayment = async (req, res, next) => {
  try {
    if (!checkRole(req.user.role, ['manager', 'superuser'])) {
      throw new APIError("Not authorized", STATUS_CODE.UNAUTHORIZED, "You are not authorized to void commission payments.");
    }

    const { id } = req.params;
    const paymentId = parseInt(id, 10);

    const result = await commissionService.voidCommissionPayment(paymentId);

    handleResponse({
      res,
      message: "Commission payment voided successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export { handleCreateCommissionPayment, handleGetCommissionPayments, handleVoidCommissionPayment };
