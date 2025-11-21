import { PrismaClient } from '@prisma/client';

class KpiRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getSellerPerformance(filters) {
    const { sellerId, period, startDate, endDate, categoryId, financerId } = filters;
    const whereClause = {};

    if (sellerId) {
      whereClause.sellerId = parseInt(sellerId, 10);
    }
    if (period) {
      whereClause.period = period;
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

    try {
      const kpis = await this.prisma.sellerPerformanceKPI.findMany({
        where: whereClause,
        include: {
          seller: { select: { id: true, name: true } },
          financer: { select: { id: true, name: true } },
          category: { select: { id: true, itemName: true, itemModel: true } },
        },
        orderBy: {
          calculationDate: 'desc',
        },
      });
      return kpis;
    } catch (error) {
      console.error("Error fetching seller performance KPIs:", error);
      throw new Error("Could not fetch seller performance KPIs.");
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

export { KpiRepository };
