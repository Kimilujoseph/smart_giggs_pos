import { ExpenseRepository } from '../databases/repository/expense-repository.js';
import { usermanagemenRepository } from '../databases/repository/usermanagement-controller-repository.js';
import { APIError, STATUS_CODE, AuthorizationError } from '../Utils/app-error.js';

class ExpenseService {
    constructor() {
        this.repository = new ExpenseRepository();
        this.usermanagemenRepository = new usermanagemenRepository();
    }

    async createExpense(expenseData, user) {
        const { shopId } = expenseData;
        const { id: userId, role } = user;

        expenseData.expenseDate = new Date();

        if (["RENT", "SUPPLIES", "MAKERTING"].includes(expenseData.category) && !["manager", "superuser"].includes(role)) {
            throw new AuthorizationError("You are not authorized to create expenses of this category.");
        }

        const assignment = await this.usermanagemenRepository.findAssignedShop(userId);

        if (!assignment.some(a => a.shopID === shopId)) {
            throw new AuthorizationError("You are not assigned to this shop.");
        }


        return this.repository.createExpense(expenseData);
    }

    async getExpenses(options) {
        return this.repository.getExpenses(options);
    }
}

export { ExpenseService };
