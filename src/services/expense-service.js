import { ExpenseRepository } from '../databases/repository/expense-repository.js';
import { usermanagemenRepository } from '../databases/repository/usermanagement-controller-repository.js';
import { APIError, STATUS_CODE, AuthorizationError, NotFoundError } from '../Utils/app-error.js';

class ExpenseService {
    constructor() {
        this.repository = new ExpenseRepository();
        this.usermanagemenRepository = new usermanagemenRepository();
    }

    async createExpense(expenseData, user) {
        const { shopId, category } = expenseData;
        const { id: userId, role } = user;

        expenseData.expenseDate = new Date();
        expenseData.status = 'PENDING';

        if (["RENT", "SUPPLIES", "MARKETING"].includes(category) && !["manager", "superuser"].includes(role)) {
            throw new AuthorizationError("You are not authorized to create expenses of this category.");
        }

        const assignment = await this.usermanagemenRepository.findAssignedShop(userId);

        if (!assignment.some(a => a.shopID === shopId)) {
            throw new AuthorizationError("You are not assigned to this shop.");
        }

        return this.repository.createExpense(expenseData);
    }

    async getExpenseById(id, user) {
        const expense = await this.repository.getExpenseById(id);

        if (!["manager", "superuser"].includes(user.role) && expense.processedById !== user.id) {
            throw new AuthorizationError("You are not authorized to view this expense.");
        }

        return expense;
    }

    async getExpenses(options, user) {
        const { role, id: userId } = user;

        if (!["manager", "superuser"].includes(role)) {
            options.employeeId = userId;
        }

        return this.repository.getExpenses(options);
    }

    async updateExpense(id, updateData, user) {
        const expense = await this.repository.getExpenseById(id);

        if (!["manager", "superuser"].includes(user.role) && expense.processedById !== user.id) {
            throw new AuthorizationError("You are not authorized to update this expense.");
        }

        if (expense.status === 'APPROVED') {
            throw new APIError("Cannot update approved expense", STATUS_CODE.FORBIDDEN, "Approved expenses cannot be modified.");
        }

        return this.repository.updateExpense(id, updateData, user.id);
    }

    async deleteExpense(id, user) {
        const expense = await this.repository.getExpenseById(id);

        if (!["manager", "superuser"].includes(user.role) && expense.processedById !== user.id) {
            throw new AuthorizationError("You are not authorized to delete this expense.");
        }

        if (expense.status === 'APPROVED') {
            throw new APIError("Cannot delete approved expense", STATUS_CODE.FORBIDDEN, "Approved expenses cannot be deleted.");
        }

        return this.repository.softDeleteExpense(id, user.id);
    }

    async approveExpense(id, user) {
        if (!["manager", "superuser"].includes(user.role)) {
            throw new AuthorizationError("You are not authorized to approve expenses.");
        }

        return this.repository.approveExpense(id, user.id);
    }

    async rejectExpense(id, reason, user) {
        if (!["manager", "superuser"].includes(user.role)) {
            throw new AuthorizationError("You are not authorized to reject expenses.");
        }

        if (!reason || reason.trim().length < 5) {
            throw new APIError("Invalid rejection reason", STATUS_CODE.BAD_REQUEST, "Please provide a detailed rejection reason (min 5 characters).");
        }

        return this.repository.rejectExpense(id, reason, user.id);
    }

    async getAuditLogs(expenseId, user) {
        if (!["manager", "superuser"].includes(user.role)) {
            throw new AuthorizationError("You are not authorized to view audit logs.");
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
            throw new AuthorizationError("You are not authorized to view budget utilization.");
        }

        return this.repository.getBudgetUtilization(options);
    }

    async getPendingExpenses(user) {
        if (!["manager", "superuser"].includes(user.role)) {
            throw new AuthorizationError("You are not authorized to view pending expenses.");
        }

        return this.repository.getPendingExpenses();
    }
}

export { ExpenseService };
