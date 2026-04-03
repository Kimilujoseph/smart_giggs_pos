import express from 'express';
import {
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
} from '../controllers/expense-controller.js';
import verifyUser from '../../middleware/verification.js';
import { parseDateQuery } from '../../middleware/query-parser.js';

const router = express.Router();

// Create expense
router.post('/create', verifyUser, handleCreateExpense);

// Get all expenses (with filters & pagination)
router.get('/', verifyUser, parseDateQuery, handleGetExpenses);

// Get pending expenses (manager/superuser only)
router.get('/pending', verifyUser, handleGetPendingExpenses);

// Get analytics (manager/superuser only)
router.get('/analytics', verifyUser, handleGetAnalytics);

// Get budget utilization (manager/superuser only)
router.get('/budget-utilization', verifyUser, parseDateQuery, handleGetBudgetUtilization);

// Get single expense by ID
router.get('/:id', verifyUser, handleGetExpenseById);

// Update expense
router.put('/:id', verifyUser, handleUpdateExpense);

// Delete expense (soft delete)
router.delete('/:id', verifyUser, handleDeleteExpense);

// Approve expense (manager/superuser only)
router.post('/:id/approve', verifyUser, handleApproveExpense);

// Reject expense (manager/superuser only)
router.post('/:id/reject', verifyUser, handleRejectExpense);

// Get audit logs for expense (manager/superuser only)
router.get('/:id/audit-logs', verifyUser, handleGetAuditLogs);

export default router;
