import { ExpenseService } from "../../services/expense-service.js";
import { handleResponse } from "../../helpers/responseUtils.js";
import { checkRole } from "../../helpers/authorisation.js";
import {
  APIError,
  STATUS_CODE,
  ValidationError,
} from "../../Utils/app-error.js";
import {
  expenseInput,
  expenseUpdateInput,
  rejectionReasonInput,
  analyticsQuery,
} from "../../Utils/joivalidation.js";

const expenseService = new ExpenseService();

const handleCreateExpense = async (req, res, next) => {
  try {
    const { error } = expenseInput(req.body);
    if (error) {
      throw new ValidationError(
        error.details.map((detail) => detail.message).join(", ")
      );
    }
    const expenseData = {
      ...req.body,
      processedById: req.user.id,
    };

    const result = await expenseService.createExpense(expenseData, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.CREATED,
      message: "Expense created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetExpenses = async (req, res, next) => {
  try {
    const { page, limit, employeeId, shopId, category, status, paymentMethod } =
      req.query;
    const { startDate, endDate } = req.dateQuery || {};

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      startDate,
      endDate,
      employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
      shopId: shopId ? parseInt(shopId, 10) : undefined,
      category,
      status,
      paymentMethod,
    };

    const expenses = await expenseService.getExpenses(options, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Expenses retrieved successfully",
      data: expenses,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseById(id, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Expense retrieved successfully",
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

const handleUpdateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = expenseUpdateInput(req.body);
    if (error) {
      throw new ValidationError(
        error.details.map((detail) => detail.message).join(", ")
      );
    }

    const result = await expenseService.updateExpense(id, req.body, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Expense updated successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleDeleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    await expenseService.deleteExpense(id, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Expense deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

const handleApproveExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await expenseService.approveExpense(id, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Expense approved successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleRejectExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = rejectionReasonInput(req.body);
    if (error) {
      throw new ValidationError(
        error.details.map((detail) => detail.message).join(", ")
      );
    }

    const result = await expenseService.rejectExpense(
      id,
      req.body.reason,
      req.user
    );

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Expense rejected successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await expenseService.getAuditLogs(id, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Audit logs retrieved successfully",
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetAnalytics = async (req, res, next) => {
  try {
    const { error } = analyticsQuery(req.query);
    if (error) {
      throw new ValidationError(
        error.details.map((detail) => detail.message).join(", ")
      );
    }

    const { startDate, endDate, groupBy, shopId } = req.query;
    const options = {
      startDate,
      endDate,
      groupBy,
      shopId: shopId ? parseInt(shopId, 10) : undefined,
    };

    const analytics = await expenseService.getAnalytics(options, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Analytics retrieved successfully",
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetBudgetUtilization = async (req, res, next) => {
  try {
    const { shopId } = req.query;
    const { startDate, endDate } = req.dateQuery || {};

    const options = {
      shopId: shopId ? parseInt(shopId, 10) : undefined,
      startDate,
      endDate,
    };

    const budget = await expenseService.getBudgetUtilization(options, req.user);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Budget utilization retrieved successfully",
      data: budget,
    });
  } catch (err) {
    next(err);
  }
};

const handleGetPendingExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.dateQuery;
    const { page, limit } = req.query;

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      startDate,
      endDate,
      user: req.user,
    };

    const expenses = await expenseService.getPendingExpenses(options);

    handleResponse({
      res,
      statusCode: STATUS_CODE.OK,
      message: "Pending expenses retrieved successfully",
      data: expenses,
    });
  } catch (err) {
    next(err);
  }
};

export {
  handleCreateExpense,
  handleGetExpenses,
  handleGetExpenseById,
  handleUpdateExpense,
  handleDeleteExpense,
  handleApproveExpense,
  handleRejectExpense,
  handleGetAuditLogs,
  handleGetAnalytics,
  handleGetBudgetUtilization,
  handleGetPendingExpenses,
};
