import { PrismaClient } from '@prisma/client';
import { InternalServerError } from '../../Utils/app-error.js';

class ExpenseRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async createExpense(data) {
        try {
            return this.prisma.expense.create({
                data,
            });
        } catch (err) {
            throw new InternalServerError("Failed to create expense");
        }
    }

    async getExpenses({ shopId, employeeId, startDate, endDate, page, limit }) {
        try {
            const where = {
                ...(shopId && { shopId }),
                ...(employeeId && { processedById: employeeId }),
                ...(startDate && endDate && {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                }),
            };

            const totalCount = await this.prisma.expense.count({ where });
            const totalPages = Math.ceil(totalCount / limit);

            const expenses = await this.prisma.expense.findMany({
                where,
                include: {
                    actors: {
                        select: {
                            name: true,
                        },
                    },
                    shops: {
                        select: {
                            shopName: true,
                        },
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
            });

            const aggregation = await this.prisma.expense.aggregate({
                where,
                _sum: {
                    amount: true,
                },
            });

            return {
                expenses,
                totalCount,
                totalPages,
                currentPage: page,
                totalAmount: aggregation._sum.amount || 0,
            };
        } catch (err) {
            throw new InternalServerError("Failed to retrieve expenses");
        }
    }
}

export { ExpenseRepository };
