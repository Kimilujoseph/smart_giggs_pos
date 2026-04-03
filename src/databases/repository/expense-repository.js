import { PrismaClient } from '@prisma/client';
import { InternalServerError, NotFoundError, DuplicationError } from '../../Utils/app-error.js';

class ExpenseRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async createExpense(data) {
        try {
            return this.prisma.expense.create({
                data,
                include: {
                    actors: { select: { id: true, name: true, email: true } },
                    shops: { select: { id: true, shopName: true } },
                },
            });
        } catch (err) {
            if (err.code === 'P2002') {
                throw new DuplicationError("An expense with this reference already exists");
            }
            throw new InternalServerError("Failed to create expense");
        }
    }

    async getExpenseById(id) {
        try {
            const expense = await this.prisma.expense.findUnique({
                where: { id: parseInt(id, 10) },
                include: {
                    actors: { select: { id: true, name: true, email: true } },
                    shops: { select: { id: true, shopName: true } },
                    approvedBy: { select: { id: true, name: true, email: true } },
                    attachments: {
                        include: { uploadedBy: { select: { id: true, name: true } } },
                        orderBy: { uploadedAt: 'desc' },
                    },
                    comments: {
                        include: { user: { select: { id: true, name: true } } },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!expense || expense.deletedAt) {
                throw new NotFoundError("Expense not found");
            }

            return expense;
        } catch (err) {
            if (err instanceof NotFoundError) throw err;
            throw new InternalServerError("Failed to retrieve expense");
        }
    }

    async getExpenses({ shopId, employeeId, startDate, endDate, category, status, paymentMethod, page = 1, limit = 10 }) {
        try {
            const where = {
                deletedAt: null,
                ...(shopId && { shopId }),
                ...(employeeId && { processedById: employeeId }),
                ...(category && { category }),
                ...(status && { status }),
                ...(paymentMethod && { paymentMethod }),
                ...(startDate && endDate && {
                    expenseDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            };

            const totalCount = await this.prisma.expense.count({ where });
            const totalPages = Math.ceil(totalCount / limit);

            const expenses = await this.prisma.expense.findMany({
                where,
                include: {
                    actors: { select: { id: true, name: true } },
                    shops: { select: { id: true, shopName: true } },
                    approvedBy: { select: { id: true, name: true } },
                    _count: {
                        select: {
                            attachments: true,
                            comments: true,
                        },
                    },
                },
                orderBy: { expenseDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            });

            const aggregation = await this.prisma.expense.aggregate({
                where,
                _sum: { amount: true },
                _avg: { amount: true },
                _min: { amount: true },
                _max: { amount: true },
            });

            return {
                expenses,
                totalCount,
                totalPages,
                currentPage: page,
                totalAmount: aggregation._sum.amount || 0,
                averageAmount: aggregation._avg.amount || 0,
                minAmount: aggregation._min.amount || 0,
                maxAmount: aggregation._max.amount || 0,
            };
        } catch (err) {
            throw new InternalServerError("Failed to retrieve expenses");
        }
    }

    async updateExpense(id, data, userId) {
        try {
            const existing = await this.prisma.expense.findUnique({
                where: { id: parseInt(id, 10) },
            });

            if (!existing || existing.deletedAt) {
                throw new NotFoundError("Expense not found");
            }

            if (existing.status === 'APPROVED') {
                throw new InternalServerError("Cannot update an approved expense");
            }

            return this.prisma.expense.update({
                where: { id: parseInt(id, 10) },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
                include: {
                    actors: { select: { id: true, name: true } },
                    shops: { select: { id: true, shopName: true } },
                },
            });
        } catch (err) {
            if (err instanceof NotFoundError) throw err;
            if (err instanceof InternalServerError) throw err;
            throw new InternalServerError("Failed to update expense");
        }
    }

    async softDeleteExpense(id, userId) {
        try {
            const existing = await this.prisma.expense.findUnique({
                where: { id: parseInt(id, 10) },
            });

            if (!existing || existing.deletedAt) {
                throw new NotFoundError("Expense not found");
            }

            if (existing.status === 'APPROVED') {
                throw new InternalServerError("Cannot delete an approved expense");
            }

            return this.prisma.expense.update({
                where: { id: parseInt(id, 10) },
                data: {
                    deletedAt: new Date(),
                    status: 'REJECTED',
                },
            });
        } catch (err) {
            if (err instanceof NotFoundError) throw err;
            if (err instanceof InternalServerError) throw err;
            throw new InternalServerError("Failed to delete expense");
        }
    }

    async approveExpense(id, approvedById) {
        try {
            const existing = await this.prisma.expense.findUnique({
                where: { id: parseInt(id, 10) },
            });

            if (!existing || existing.deletedAt) {
                throw new NotFoundError("Expense not found");
            }

            if (existing.status === 'APPROVED') {
                throw new DuplicationError("Expense is already approved");
            }

            if (existing.status === 'REJECTED') {
                throw new InternalServerError("Cannot approve a rejected expense");
            }

            return this.prisma.expense.update({
                where: { id: parseInt(id, 10) },
                data: {
                    status: 'APPROVED',
                    approvedById,
                    approvedAt: new Date(),
                },
                include: {
                    actors: { select: { id: true, name: true } },
                    approvedBy: { select: { id: true, name: true } },
                },
            });
        } catch (err) {
            if (err instanceof NotFoundError) throw err;
            if (err instanceof DuplicationError) throw err;
            if (err instanceof InternalServerError) throw err;
            throw new InternalServerError("Failed to approve expense");
        }
    }

    async rejectExpense(id, reason, userId) {
        try {
            const existing = await this.prisma.expense.findUnique({
                where: { id: parseInt(id, 10) },
            });

            if (!existing || existing.deletedAt) {
                throw new NotFoundError("Expense not found");
            }

            if (existing.status === 'APPROVED') {
                throw new InternalServerError("Cannot reject an approved expense");
            }

            return this.prisma.expense.update({
                where: { id: parseInt(id, 10) },
                data: {
                    status: 'REJECTED',
                    rejectionReason: reason,
                },
                include: {
                    actors: { select: { id: true, name: true } },
                },
            });
        } catch (err) {
            if (err instanceof NotFoundError) throw err;
            if (err instanceof InternalServerError) throw err;
            throw new InternalServerError("Failed to reject expense");
        }
    }

    async createAuditLog(expenseId, action, changedById, oldValue, newValue, reason) {
        try {
            return this.prisma.expenseAuditLog.create({
                data: {
                    expenseId,
                    action,
                    changedById,
                    oldValue: oldValue ? JSON.stringify(oldValue) : null,
                    newValue: newValue ? JSON.stringify(newValue) : null,
                    reason,
                },
            });
        } catch (err) {
            throw new InternalServerError("Failed to create audit log");
        }
    }

    async getAuditLogs(expenseId) {
        try {
            return this.prisma.expenseAuditLog.findMany({
                where: { expenseId },
                include: {
                    changedBy: { select: { id: true, name: true } },
                },
                orderBy: { changedAt: 'desc' },
            });
        } catch (err) {
            throw new InternalServerError("Failed to retrieve audit logs");
        }
    }

    async getAnalytics({ startDate, endDate, groupBy = 'category', shopId }) {
        try {
            const where = {
                deletedAt: null,
                status: 'APPROVED',
                ...(shopId && { shopId }),
                ...(startDate && endDate && {
                    expenseDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            };

            const expenses = await this.prisma.expense.findMany({
                where,
                select: {
                    id: true,
                    amount: true,
                    category: true,
                    subcategory: true,
                    expenseDate: true,
                    shopId: true,
                    paymentMethod: true,
                },
            });

            const grouped = expenses.reduce((acc, expense) => {
                const key = groupBy === 'category' ? expense.category
                    : groupBy === 'subcategory' ? (expense.subcategory || 'Uncategorized')
                    : groupBy === 'paymentMethod' ? (expense.paymentMethod || 'Unknown')
                    : groupBy === 'shop' ? `Shop_${expense.shopId || 'NoShop'}`
                    : 'all';

                if (!acc[key]) {
                    acc[key] = { count: 0, total: 0, items: [] };
                }
                acc[key].count += 1;
                acc[key].total += parseFloat(expense.amount);
                acc[key].items.push(expense);
                return acc;
            }, {});

            const summary = Object.entries(grouped).map(([key, data]) => ({
                group: key,
                count: data.count,
                total: data.total,
                average: data.total / data.count,
            })).sort((a, b) => b.total - a.total);

            const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

            return {
                totalExpenses,
                totalCount: expenses.length,
                averageExpense: expenses.length ? totalExpenses / expenses.length : 0,
                grouped: summary,
                period: { startDate, endDate },
            };
        } catch (err) {
            throw new InternalServerError("Failed to retrieve analytics");
        }
    }

    async getBudgetUtilization({ shopId, startDate, endDate }) {
        try {
            const where = {
                deletedAt: null,
                status: { in: ['APPROVED', 'PENDING'] },
                ...(shopId && { shopId }),
                ...(startDate && endDate && {
                    expenseDate: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    },
                }),
            };

            const byCategory = await this.prisma.expense.groupBy({
                by: ['category'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            });

            const totalSpent = await this.prisma.expense.aggregate({
                where,
                _sum: { amount: true },
            });

            return {
                totalSpent: totalSpent._sum.amount || 0,
                byCategory: byCategory.map(c => ({
                    category: c.category,
                    total: c._sum.amount || 0,
                    count: c._count.id,
                })),
                period: { startDate, endDate },
            };
        } catch (err) {
            throw new InternalServerError("Failed to retrieve budget utilization");
        }
    }

    async getPendingExpenses() {
        try {
            return this.prisma.expense.findMany({
                where: {
                    status: 'PENDING',
                    deletedAt: null,
                },
                include: {
                    actors: { select: { id: true, name: true, email: true } },
                    shops: { select: { id: true, shopName: true } },
                },
                orderBy: { expenseDate: 'asc' },
            });
        } catch (err) {
            throw new InternalServerError("Failed to retrieve pending expenses");
        }
    }
}

export { ExpenseRepository };
