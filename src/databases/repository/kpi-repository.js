import { PrismaClient } from '@prisma/client';

class KpiRepository {
  constructor() {
    this.prisma = new PrismaClient();
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
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

export { KpiRepository };
