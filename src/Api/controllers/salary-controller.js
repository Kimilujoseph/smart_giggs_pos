import { SalaryService } from '../../services/salary-service.js';
import { handleResponse } from '../../helpers/responseUtils.js';
import { checkRole } from '../../helpers/authorisation.js';
import { APIError, STATUS_CODE } from '../../Utils/app-error.js';

const salaryService = new SalaryService();

const handleCreateSalaryPayment = async (req, res, next) => {
  try {
    const paymentData = {
      ...req.body,
      processedById: req.user.id,
    };

    const result = await salaryService.createSalaryPayment(paymentData);

    handleResponse({
      res,
      statusCode: STATUS_CODE.CREATED,
      message: "Salary payment created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetSalaryPayments = async (req, res, next) => {
  try {
    const { user } = req;
    const { page = 1, limit = 10, employeeId } = req.query;
    const { startDate, endDate } = req.dateQuery;

    // Authorization Check
    if (employeeId) {
      const requestedEmployeeId = parseInt(employeeId, 10);
      if (!checkRole(user.role, ['manager', 'superuser']) && user.id !== requestedEmployeeId) {
        throw new APIError("Forbidden", STATUS_CODE.FORBIDDEN, "You are not authorized to view this employee's salary payments.");
      }
    } else if (!checkRole(user.role, ['manager', 'superuser'])) {
      throw new APIError("Forbidden", STATUS_CODE.FORBIDDEN, "You are not authorized to view salary payments.");
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      startDate,
      endDate,
      employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
    };

    const result = await salaryService.getSalaryPayments(options);

    handleResponse({
      res,
      message: "Salary payments retrieved successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleVoidSalaryPayment = async (req, res, next) => {
  try {
    if (!checkRole(req.user.role, ['manager', 'superuser'])) {
      throw new APIError("Not authorized", STATUS_CODE.UNAUTHORIZED, "You are not authorized to void salary payments.");
    }

    const { id } = req.params;
    const paymentId = parseInt(id, 10);

    const result = await salaryService.voidSalaryPayment(paymentId);

    handleResponse({
      res,
      message: "Salary payment voided successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export { handleCreateSalaryPayment, handleGetSalaryPayments, handleVoidSalaryPayment };
