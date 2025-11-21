import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();


export async function calculateAndStoreKPIs(calculationDate = new Date()) {
  console.log(`Starting KPI calculation for ${calculationDate.toISOString().split('T')[0]}...`);

  // Define the time period for the calculation (the entirety of the given day)
  const startDate = new Date(calculationDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(calculationDate);
  endDate.setHours(23, 59, 59, 999);

  try {
    // 1. Fetch and aggregate mobile sales data
    const mobileSales = await prisma.mobilesales.groupBy({
      by: ['sellerId', 'financerId', 'categoryId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED', // Only consider completed sales
        categoryId: { not: null } // Ensure category is not null
      },
      _sum: {
        soldPrice: true,
        quantity: true,
        profit: true,
        commission: true,
      },
      _count: {
        id: true
      }
    });

    // 2. Fetch and aggregate accessory sales data
    const accessorySales = await prisma.accessorysales.groupBy({
      by: ['sellerId', 'financerId', 'categoryId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
        categoryId: { not: null }
      },
      _sum: {
        soldPrice: true,
        quantity: true,
        profit: true,
        commission: true,
      },
      _count: {
        id: true
      }
    });

    // 3. Merge the sales data into a single structure for processing
    const allSales = {};

    [...mobileSales, ...accessorySales].forEach(sale => {
      const key = `${sale.sellerId}-${sale.financerId || 'none'}-${sale.categoryId}`;
      if (!allSales[key]) {
        allSales[key] = {
          sellerId: sale.sellerId,
          financerId: sale.financerId,
          categoryId: sale.categoryId,
          totalSalesRevenue: 0,
          totalUnitsSold: 0,
          totalGrossProfit: 0,
          totalCommissionPaid: 0,
          totalTransactions: 0,
        };
      }
      allSales[key].totalSalesRevenue += Number(sale._sum.soldPrice) || 0;
      allSales[key].totalUnitsSold += sale._sum.quantity || 0;
      allSales[key].totalGrossProfit += sale._sum.profit || 0;
      allSales[key].totalCommissionPaid += sale._sum.commission || 0;
      allSales[key].totalTransactions += sale._count.id || 0;
    });

    // 4. Process each aggregated group to calculate final KPIs and save to the database
    for (const key in allSales) {
      const group = allSales[key];

      // Fetch returns for this specific group to calculate return rate
      // const returns = await prisma.return.count({
      //   where: {
      //     returnedAt: { gte: startDate, lte: endDate },
      //     OR: [
      //       { accessorySaleId: { categoryId: group.categoryId, financerId: group.financerId } },
      //       { mobileSaleId: { categoryId: group.categoryId, financerId: group.financerId } },
      //     ],
      //   },
      // });

      // Calculate final KPI metrics
      const {
        sellerId,
        financerId,
        categoryId,
        totalSalesRevenue,
        totalUnitsSold,
        totalGrossProfit,
        totalCommissionPaid,
        totalTransactions
      } = group;

      const averageDealSize = totalTransactions > 0 ? totalSalesRevenue / totalTransactions : 0;
      const profitMargin = totalSalesRevenue > 0 ? (totalGrossProfit / totalSalesRevenue) * 100 : 0;
      //const returnRate = totalUnitsSold > 0 ? (returns / totalUnitsSold) * 100 : 0;
      const commissionAsPercentageOfSales = totalSalesRevenue > 0 ? (totalCommissionPaid / totalSalesRevenue) * 100 : 0;

      // 5. Use upsert to create a new KPI record or update an existing one
      await prisma.sellerPerformanceKPI.upsert({
        where: {
          sellerId_financerId_categoryId_calculationDate_period: {
            sellerId,
            financerId: financerId || null,
            categoryId,
            calculationDate: startDate,
            period: 'DAILY',
          }
        },
        update: {
          totalSalesRevenue,
          totalUnitsSold,
          averageDealSize,
          totalGrossProfit,
          profitMargin,
          returnRate: 0,
          totalCommissionPaid,
          commissionAsPercentageOfSales,
        },
        create: {
          sellerId,
          financerId,
          categoryId,
          calculationDate: startDate,
          period: 'DAILY',
          totalSalesRevenue,
          totalUnitsSold,
          averageDealSize,
          totalGrossProfit,
          profitMargin,
          returnRate: 0,
          totalCommissionPaid,
          commissionAsPercentageOfSales,
        },
      });
      console.log(`Successfully processed KPI for seller ${sellerId}, category ${categoryId}.`);
    }

    console.log('KPI calculation completed successfully.');

  } catch (error) {
    console.error('Error calculating KPIs:', error);
  } finally {
    // 6. Ensure the database connection is closed
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Allow the script to be run directly from the command line
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const scriptPath = process.argv[1];

if (scriptPath === currentFilePath) {
  // If a date is provided as a command-line argument, use it. Otherwise, use yesterday.
  const argDate = process.argv[2] ? new Date(process.argv[2]) : null;

  if (argDate && isNaN(argDate.getTime())) {
    console.error("Invalid date provided. Please use YYYY-MM-DD format.");
    process.exit(1);
  }

  const dateToProcess = argDate || new Date(Date.now() - 86400000); // Default to yesterday

  calculateAndStoreKPIs(dateToProcess);
}

