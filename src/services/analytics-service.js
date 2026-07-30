import { AnalyticsRepository } from '../databases/repository/analytics-repository.js';
import { Sales } from '../databases/repository/sales-repository.js';
import { APIError, STATUS_CODE, InternalServerError } from '../Utils/app-error.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AnalyticsService {
    constructor() {
        this.repository = new AnalyticsRepository();
        this.salesRepository = new Sales();
    }



    async getTopProductsAnalytics(options) {
        try {
            const topProductsData = await this.repository.getTopProducts(options);
            return topProductsData;
        } catch (err) {
            throw new InternalServerError("Internal server error")
        }
    }



    async getShopPerformanceSummary(options) {
        try {
            const summaryData = await this.repository.getShopPerformanceSummary(options);

            //console.log("$#$#$", summaryData)
            const grouped = summaryData.reduce((acc, row) => {
                let shop = acc.find(s => s.shopId === row.shopId);

                if (!shop) {
                    shop = {
                        shopId: row.shopId,
                        shopName: row.shopName.trim(),
                        categories: {}
                    };

                    acc.push(shop);
                }

                shop.categories[row.itemType] = {
                    totalRevenue: Number(row.totalRevenue),
                    grossProfit: Number(row.grossProfit),
                    totalUnitsSold: Number(row.totalUnitsSold),
                    totalCommission: Number(row.totalCommission),
                    totalFinanceAmount: Number(row.totalFinanceAmount)
                };

                return acc;
            }, []);
            //console.log("grouped", JSON.stringify(grouped))
            return grouped;
        } catch (err) {
            throw new InternalServerError("Internal server error")
        }
    }

    async getSalesByStatus(options) {
        try {
            const summaryData = await this.repository.getSalesByStatus(options);

            const enrichedData = summaryData.map(s => {
                return {
                    financeStatus: s.financeStatus,
                    totalRevenue: s._sum.totalRevenue,
                    grossProfit: s._sum.grossProfit,
                    totalUnitsSold: s._sum.totalUnitsSold,
                    totalCommission: s._sum.totalCommission,
                    totalfinanceAmount: s._sum.totalfinanceAmount,
                }
            });

            return enrichedData;
        } catch (err) {
            throw new InternalServerError("Internal server error")
        }
    }
}

export { AnalyticsService };
