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

            const categoryIds = topProductsData.map(p => p.categoryId);

            if (categoryIds.length === 0) {
                return [];
            }
            const categoryDetails = new Map()

            const categories = await prisma.categories.findMany({
                where: { id: { in: categoryIds } }
            })

            categories.forEach(p => categoryDetails.set(p.id, { name: p.itemName, brand: p.brand }))

            const enrichedData = topProductsData.map(p => {
                const details = categoryDetails.get(p.categoryId);
                // console.log("categories@@@@@@@@@@@", details)
                return {
                    productId: p.productId,
                    productName: details ? `${details.brand} ${details.name}` : 'Unknown',
                    totalRevenue: p._sum.totalRevenue,
                    grossProfit: p._sum.grossProfit,
                    totalUnitsSold: p._sum.totalUnitsSold,
                }
            });

            return enrichedData;
        } catch (err) {
            throw new InternalServerError("Internal server error")
        }
    }



    async getShopPerformanceSummary(options) {
        try {
            const summaryData = await this.repository.getShopPerformanceSummary(options);

            //console.log("$#$#$", summaryData)

            const shopIds = summaryData.map(s => s.shopId);

            if (shopIds.length === 0) {
                return [];
            }

            const shops = await prisma.shops.findMany({
                where: { id: { in: shopIds } },
                select: { id: true, shopName: true },
            });

            const shopsMap = new Map();
            shops.forEach(s => shopsMap.set(s.id, s.shopName));

            const enrichedData = summaryData.map(s => {
                return {
                    shopId: s.shopId,
                    shopName: shopsMap.get(s.shopId) || 'Unknown',
                    totalRevenue: s._sum.totalRevenue,
                    grossProfit: s._sum.grossProfit,
                    totalUnitsSold: s._sum.totalUnitsSold,
                    totalCommission: s._sum.totalCommission,
                    totalfinanceAmount: s._sum.totalfinanceAmount,
                }
            });
            //console.log("enriched data", enrichedData)
            return enrichedData;
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
