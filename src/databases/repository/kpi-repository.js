import prisma from '../client.js';

class KpiRepository {
  constructor() {
    this.prisma = prisma;
  }

  async getSellerPerformance(filters) {
    const { sellerId, startDate, endDate, categoryId, financerId, page = 1, limit = 10 } = filters;
    const whereClause = {};

    if (sellerId) {
      whereClause.sellerId = parseInt(sellerId, 10);
    }
    if (startDate && endDate) {
      whereClause.calculationDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (categoryId) {
      whereClause.categoryId = parseInt(categoryId, 10);
    }
    if (financerId) {
      whereClause.financerId = parseInt(financerId, 10);
    }

    const skip = (page - 1) * limit;

    try {
      const [kpis, total] = await this.prisma.$transaction([
        this.prisma.sellerPerformanceKPI.findMany({
          where: whereClause,
          include: {
            seller: { select: { id: true, name: true } },
            financer: { select: { id: true, name: true } },
            category: { select: { id: true, itemName: true, itemModel: true } },
          },
          orderBy: {
            calculationDate: 'desc',
          },
          skip: skip,
          take: limit,
        }),
        this.prisma.sellerPerformanceKPI.count({
          where: whereClause,
        }),
      ]);

      return { kpis, total };
    } catch (error) {
      console.error("Error fetching seller performance KPIs:", error);
      throw new Error("Could not fetch seller performance KPIs.");
    }
  }

  async getSalesForKpiReport({ sellerId, startDate, endDate }) {
    if (!startDate || !endDate) {
      console.error("Error: startDate and endDate must be defined for KPI report.");
      throw new Error("Could not fetch sales for KPI report due to missing date range.");
    }
    try {
      const whereClause = {
        sellerId: parseInt(sellerId, 10),
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };

      const mobileSales = await this.prisma.mobilesales.groupBy({
        by: ['categoryId'],
        where: whereClause,
        _sum: {
          quantity: true,
        },
      });

      const accessorySales = await this.prisma.accessorysales.groupBy({
        by: ['categoryId'],
        where: whereClause,
        _sum: {
          quantity: true,
        },
      });

      const categoryIds = [...new Set([...mobileSales.map(s => s.categoryId), ...accessorySales.map(s => s.categoryId)])];
      if (categoryIds.length === 0) {
        return [];
      }
      const categories = await this.prisma.categories.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
        select: {
          id: true,
          itemType: true,
        },
      });

      const categoryMap = categories.reduce((acc, category) => {
        acc[category.id] = category.itemType;
        return acc;
      }, {});

      const aggregatedSales = {};

      for (const sale of mobileSales) {
        const itemType = categoryMap[sale.categoryId];
        if (itemType) {
          if (!aggregatedSales[itemType]) {
            aggregatedSales[itemType] = 0;
          }
          aggregatedSales[itemType] += sale._sum.quantity || 0;
        }
      }

      for (const sale of accessorySales) {
        const itemType = categoryMap[sale.categoryId];
        if (itemType) {
          if (!aggregatedSales[itemType]) {
            aggregatedSales[itemType] = 0;
          }
          aggregatedSales[itemType] += sale._sum.quantity || 0;
        }
      }

      return Object.entries(aggregatedSales).map(([itemType, count]) => ({
        itemType,
        count,
      }));

    } catch (error) {
      console.error("Error fetching sales for KPI report:", error);
      throw new Error("Could not fetch sales for KPI report.");
    }
  }
}

export { KpiRepository };
