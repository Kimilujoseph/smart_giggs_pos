import { ExpenseRepository } from "../databases/repository/expense-repository.js";
import { usermanagemenRepository } from "../databases/repository/usermanagement-controller-repository.js";
import {
  APIError,
  STATUS_CODE,
  AuthorizationError,
  BadRequestError,
  DuplicationError,
  NotFoundError,
} from "../Utils/app-error.js";

class ExpenseService {
  constructor() {
    this.repository = new ExpenseRepository();
    this.usermanagemenRepository = new usermanagemenRepository();
  }

  async createExpense(expenseData, user) {
    const { shopId, category } = expenseData;
    const { id: userId, role } = user;

    expenseData.expenseDate = new Date();
    expenseData.status = "PENDING";
    console.log(role);
    if (
      ["RENT", "SUPPLIES", "MARKETING"].includes(category) &&
      !["manager", "superuser"].includes(role)
    ) {
      throw new AuthorizationError(
        "You are not authorized to create expenses of this category."
      );
    }
    if (["seller"].includes(role)) {
      const assignment = await this.usermanagemenRepository.findAssignedShop(
        userId
      );

      if (!assignment.some((a) => a.shopID === shopId)) {
        throw new AuthorizationError("You are not assigned to this shop.");
      }
    }

    return this.repository.createExpense(expenseData);
  }

  async getExpenseById(id, user) {
    const expense = await this.repository.getExpenseById(id);

    if (
      !["manager", "superuser"].includes(user.role) &&
      expense.processedById !== user.id
    ) {
      throw new AuthorizationError(
        "You are not authorized to view this expense."
      );
    }

    return expense;
  }

  async getExpenses(options, user) {
    const { role, id: userId } = user;
    //console.log(options.employeeId);
    if (!["manager", "superuser"].includes(role)) {
      options.employeeId = userId;
    }

    return this.repository.getExpenses(options);
  }

  async updateExpense(id, updateData, user) {
    const expense = await this.repository.getExpenseById(id);

    if (
      !["manager", "superuser"].includes(user.role) &&
      expense.processedById !== user.id
    ) {
      throw new AuthorizationError(
        "You are not authorized to update this expense."
      );
    }

    if (expense.status === "APPROVED") {
      throw new APIError(
        "Cannot update approved expense",
        STATUS_CODE.FORBIDDEN,
        "Approved expenses cannot be modified."
      );
    }

    return this.repository.updateExpense(id, updateData, user.id);
  }

  async deleteExpense(id, user) {
    const expense = await this.repository.getExpenseById(id);

    if (expense.status === "APPROVED") {
      throw new BadRequestError("The request is already approved")
    }

    return this.repository.softDeleteExpense(id, user.id);
  }

  async approveExpense(id, user) {
    const existingExpense = await this.repository.findExpense(id);
    if(!existingExpense || existingExpense.deletedAt){
      throw NotFoundError('Expense Not Found')
    }
      if (existingExpense.status === "APPROVED") {
        throw new DuplicationError("Expense is already approved");
      }

      if (existingExpense.status === "REJECTED") {
        throw new BadRequestError("Cannot approve a rejected expense");
      }
    return this.repository.approveExpense(id, user.id);
  }

  async rejectExpense(id, reason, user) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError(
        "Please provide a detailed rejection reason (min 5 characters)."
      );
    }
     const existingExpense = await this.repository.findExpense(id);
     if(!existingExpense || existingExpense.deletedAt){
      throw new NotFoundError("Expense not found")
     }
     if(existingExpense.status === 'APPROVED'){
      throw new BadRequestError("you are requesting an approved response")
     }
    return this.repository.rejectExpense(id, reason, user.id);
  }

  async getAuditLogs(expenseId, user) {
    if (!["manager", "superuser"].includes(user.role)) {
      throw new AuthorizationError(
        "You are not authorized to view audit logs."
      );
    }

    return this.repository.getAuditLogs(expenseId);
  }

  async getAnalytics(options, user) {
    if (!["manager", "superuser"].includes(user.role)) {
      throw new AuthorizationError("You are not authorized to view analytics.");
    }

    return this.repository.getAnalytics(options);
  }

  async getBudgetUtilization(options, user) {
    if (!["manager", "superuser"].includes(user.role)) {
      throw new AuthorizationError(
        "You are not authorized to view budget utilization."
      );
    }

    return this.repository.getBudgetUtilization(options);
  }

  async getPendingExpenses(options) {
    const { user } = options;
    if (!["manager", "superuser"].includes(user.role)) {
      throw new AuthorizationError(
        "You are not authorized to view pending expenses."
      );
    }

    return this.repository.getPendingExpenses(options);
  }
}

export { ExpenseService };
