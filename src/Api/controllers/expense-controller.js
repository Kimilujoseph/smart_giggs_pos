import { ExpenseService } from '../../services/expense-service.js';
import { handleResponse } from '../../helpers/responseUtils.js';
import { checkRole } from '../../helpers/authorisation.js';
import { APIError, STATUS_CODE, ValidationError } from '../../Utils/app-error.js';
import { expenseInput } from '../../Utils/joivalidation.js';


const expenseService = new ExpenseService();

const handleCreateExpense = async (req, res, next) => {

    try {
        const { error } = expenseInput(req.body);
        if (error) {
            throw new ValidationError(error.details.map(detail => detail.message).join(", "));
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
        if (!checkRole(req.user.role, ['manager', 'superuser'])) {
            throw new APIError("Not authorized", STATUS_CODE.UNAUTHORIZED, "You are not authorized to view expenses.");
        }

        const { shopId } = req.params;
        const { page = 1, limit = 10, employeeId } = req.query;
        const { startDate, endDate } = req.dateQuery;

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            startDate,
            endDate,
            employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
            shopId: shopId ? parseInt(shopId, 10) : undefined,
        };

        const expenses = await expenseService.getExpenses(options);

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

export { handleCreateExpense, handleGetExpenses };
