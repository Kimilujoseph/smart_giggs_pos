import { PrismaClient } from '@prisma/client';
import { APIError, STATUS_CODE } from '../../Utils/app-error.js';

const prisma = new PrismaClient();

class CommissionRepository {
  async findCommissionPayments({ page = 1, limit = 10, sellerId, startDate, endDate } = {}) {
    try {
      const skip = (page - 1) * limit;
      const whereClause = {};
      if (sellerId) {
        whereClause.sellerId = sellerId;
      }
      if (startDate && endDate) {
        whereClause.paymentDate = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const [payments, total, summary, bySeller] = await prisma.$transaction([
        prisma.commissionPayment.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { paymentDate: 'desc' },
          include: {
            actors_CommissionPayment_sellerIdToactors: {
              select: { id: true, name: true, email: true },
            },
            actors_CommissionPayment_processedByIdToactors: {
              select: { id: true, name: true, email: true },
            },
            CommissionPaymentsOnMobileSales: {
              include: {
                mobilesales: {
                  select: {
                    id: true,
                    quantity: true,
                    soldPrice: true,
                    profit: true,
                    commission: true,
                    createdAt: true,
                    mobiles: {
                      select: {
                        IMEI: true,
                        storage: true,
                        color: true,
                        categories: {
                          select: {
                            itemName: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            CommissionPaymentsOnAccessorySales: {
              include: {
                accessorysales: {
                  select: {
                    id: true,
                    quantity: true,
                    soldPrice: true,
                    profit: true,
                    commission: true,
                    createdAt: true,
                    accessories: {
                      select: {
                        color: true,
                        categories: {
                          select: {
                            itemName: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
        }),
        prisma.commissionPayment.count({ where: whereClause }),
        prisma.commissionPayment.aggregate({
          where: whereClause,
          _sum: { amountPaid: true },
          _count: { id: true },
        }),
        prisma.commissionPayment.groupBy({
          by: ['sellerId'],
          where: whereClause,
          _sum: { amountPaid: true },
          orderBy: {
            _sum: {
              amountPaid: 'desc',
            },
          },
        }),
      ]);

      // Fetch seller details for the 'bySeller' aggregation
      const sellerIds = bySeller.map(item => item.sellerId);
      const sellers = await prisma.actors.findMany({
        where: { id: { in: sellerIds } },
        select: { id: true, name: true },
      });
      const sellerMap = new Map(sellers.map(s => [s.id, s]));

      const formattedBySeller = bySeller.map(item => ({
        seller: sellerMap.get(item.sellerId),
        totalPaid: item._sum.amountPaid || 0,
      }));

      const formattedPayments = payments.map(p => {
        const {
          actors_CommissionPayment_sellerIdToactors,
          actors_CommissionPayment_processedByIdToactors,
          CommissionPaymentsOnMobileSales,
          CommissionPaymentsOnAccessorySales,
          ...rest
        } = p;

        const mobileSales = CommissionPaymentsOnMobileSales.map(s => {
          const { mobiles, ...saleData } = s.mobilesales;
          return {
            ...saleData,
            itemName: mobiles.categories.itemName,
            IMEI: mobiles.IMEI,
            storage: mobiles.storage,
            color: mobiles.color,
          };
        });

        const accessorySales = CommissionPaymentsOnAccessorySales.map(s => {
          const { accessories, ...saleData } = s.accessorysales;
          return {
            ...saleData,
            itemName: accessories.categories.itemName,
            color: accessories.color,
          };
        });

        return {
          ...rest,
          seller: actors_CommissionPayment_sellerIdToactors,
          processedBy: actors_CommissionPayment_processedByIdToactors,
          sales: {
            mobileSales,
            accessorySales,
          }
        };
      });

      return {
        summary: {
          totalPaid: summary._sum.amountPaid || 0,
          paymentCount: summary._count.id || 0,
        },
        bySeller: formattedBySeller,
        payments: formattedPayments,
        pagination: {
          totalRecords: total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        }
      };
    } catch (err) {
      console.log(err)
      throw new APIError(
        'Database Error',
        STATUS_CODE.INTERNAL_ERROR,
        'Failed to retrieve commission payments'
      );
    }
  }

  async createCommissionPayment(paymentData, salesIds, tx) {
    const prismaClient = tx || prisma;
    try {
      const { sellerId, amountPaid, paymentDate, periodStartDate, periodEndDate, processedById } = paymentData;

      const commissionPayment = await prismaClient.commissionPayment.create({
        data: {
          sellerId,
          amountPaid,
          paymentDate,
          periodStartDate,
          periodEndDate,
          processedById,
          status: "PAID"
        },
      });

      const mobileSalesLinks = salesIds
        .filter(sale => sale.type === 'mobile')
        .map(sale => ({
          mobileSaleId: sale.salesId,
          commissionPaymentId: commissionPayment.id,
          assignedBy: String(processedById),
        }));

      const accessorySalesLinks = salesIds
        .filter(sale => sale.type === 'accessory')
        .map(sale => ({
          accessorySaleId: sale.salesId,
          commissionPaymentId: commissionPayment.id,
          assignedBy: String(processedById),
        }));

      if (mobileSalesLinks.length > 0) {
        await prismaClient.commissionPaymentsOnMobileSales.createMany({
          data: mobileSalesLinks,
        });
      }

      if (accessorySalesLinks.length > 0) {
        await prismaClient.commissionPaymentsOnAccessorySales.createMany({
          data: accessorySalesLinks,
        });
      }

      return commissionPayment;
    } catch (err) {
      console.error('Error creating commission payment:', err);
      throw new APIError(
        'Database Error',
        STATUS_CODE.INTERNAL_ERROR,
        'Failed to create commission payment'
      );
    }
  }

  async findUnpaidCommissions(sellerId) {
    try {
      const unpaidMobileSales = await prisma.mobilesales.findMany({
        where: {
          sellerId: sellerId,
          commission: {
            gt: prisma.mobilesales.fields.commissionPaid,
          },
        },
      });

      const unpaidAccessorySales = await prisma.accessorysales.findMany({
        where: {
          sellerId: sellerId,
          commission: {
            gt: prisma.accessorysales.fields.commissionPaid,
          },
        },
      });

      return [...unpaidMobileSales, ...unpaidAccessorySales];
    } catch (err) {
      throw new APIError(
        'Database Error',
        STATUS_CODE.INTERNAL_ERROR,
        'Failed to find unpaid commissions'
      );
    }
  }

  async updateSaleCommissionStatus(saleId, type, amount, status, tx) {
    const prismaClient = tx || prisma;
    const salesTable = type === 'mobile' ? prismaClient.mobilesales : prismaClient.accessorysales;

    try {
      return await salesTable.update({
        where: { id: saleId },
        data: {
          commissionPaid: {
            increment: amount,
          },
          commisssionStatus: status,
        },
      });
    } catch (err) {
      throw new APIError(
        'Database Error',
        STATUS_CODE.INTERNAL_ERROR,
        `Failed to update commission status for ${type} sale ${saleId}`
      );
    }
  }

  async voidCommissionPayment(paymentId, tx) {
    const prismaClient = tx || prisma;
    try {
      return await prismaClient.commissionPayment.update({
        where: { id: paymentId },
        data: { status: "VOIDED" },
      });
    } catch (err) {
      throw new APIError(
        'Database Error',
        STATUS_CODE.INTERNAL_ERROR,
        'Failed to void commission payment'
      );
    }
  }
}

export { CommissionRepository };
