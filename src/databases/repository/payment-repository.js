import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class PaymentRepository {


  async findPayments({
    startDate,
    endDate,
    shopId,
    sellerId,
    paymentMethod,
    page = 1,
    limit = 10,
  }) {
    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    const saleWhere = {};
    if (shopId) {
      saleWhere.shopID = parseInt(shopId, 10);
    }
    if (sellerId) {
      saleWhere.sellerId = parseInt(sellerId, 10);
    }

    if (Object.keys(saleWhere).length > 0) {
      where.OR = [
        { accessorySale: saleWhere },
        { mobileSale: saleWhere },
      ];
    }

    // 1. Get aggregates
    const paymentSummary = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    // 2. Get paginated list of payments with specific fields
    const skip = (page - 1) * limit;
    const take = parseInt(limit, 10);

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        status: true,
        transactionId: true,
        createdAt: true,
        updatedAt: true,
        accessorySale: {
          select: {
            actors: { select: { name: true } },
            shops: { select: { shopName: true } },
          },
        },
        mobileSale: {
          select: {
            actors: { select: { name: true } },
            shops: { select: { shopName: true } },
          },
        },
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Reshape the data
    const transformedPayments = payments.map(payment => {
      const sale = payment.accessorySale || payment.mobileSale;
      const sellerName = sale && sale.actors ? sale.actors.name : null;
      const shopName = sale && sale.shops ? sale.shops.shopName : null;

      return {
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        sellerName: sellerName,
        shopName: shopName,
      };
    });

    const totalPayments = await prisma.payment.count({ where });

    return {
      summary: paymentSummary,
      payments: transformedPayments,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: parseInt(page, 10),
    };
  }
}

export default PaymentRepository;
