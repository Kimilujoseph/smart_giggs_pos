import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BATCH_SIZE = 1000; // Process 1000 sales at a time

async function backfillSales(salesTable) {
  let cursor = null;
  let page = 1;
  let hasMore = true;

  console.log(`Starting backfill for ${salesTable}...`);

  while (hasMore) {
    console.log(`Processing page ${page} for ${salesTable}...`);
    const sales = await prisma[salesTable].findMany({
      take: BATCH_SIZE,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: {
        id: 'asc',
      },
      include: salesTable === 'mobilesales'
        ? { mobiles: true }
        : { accessories: true },
    });

    if (sales.length === 0) {
      hasMore = false;
      continue;
    }

    const analyticsMap = new Map();

    for (const sale of sales) {
      const productDetails = sale.mobiles || sale.accessories;
      if (!productDetails) continue; // Skip if product data is missing

      const saleDate = new Date(sale.createdAt);
      saleDate.setUTCHours(0, 0, 0, 0); // Normalize to the start of the UTC day

      const key = `${saleDate.toISOString()}-${sale.shopID}-${sale.sellerId}-${sale.categoryId}-${sale.financeStatus}-${sale.financerId || null}`;

      const quantity = sale.quantity || 0;
      const soldPrice = Number(sale.soldPrice) || 0;
      const productCost = Number(productDetails.productCost) || 0;
      const commission = Number(productDetails.commission) || 0;
      const financeAmount = Number(sale.financeAmount) || 0;

      const totalRevenue = soldPrice * quantity;
      const totalCostOfGoods = productCost * quantity;
      const grossProfit = totalRevenue - totalCostOfGoods;
      const totalCommission = commission * quantity;

      if (!analyticsMap.has(key)) {
        analyticsMap.set(key, {
          date: saleDate,
          categoryId: sale.categoryId,
          shopId: sale.shopID,
          sellerId: sale.sellerId,
          financeStatus: sale.financeStatus,
          financeId: sale.financerId || null,
          totalUnitsSold: 0,
          totalRevenue: 0,
          totalCostOfGoods: 0,
          grossProfit: 0,
          totalCommission: 0,
          totalfinanceAmount: 0,
        });
      }

      const current = analyticsMap.get(key);
      current.totalUnitsSold += quantity;
      current.totalRevenue += totalRevenue;
      current.totalCostOfGoods += totalCostOfGoods;
      current.grossProfit += grossProfit;
      current.totalCommission += totalCommission;
      current.totalfinanceAmount += financeAmount;
    }

    for (const data of analyticsMap.values()) {
      await prisma.dailySalesAnalytics.upsert({
        where: {
          date_categoryId_shopId_sellerId_financeId_financeStatus: {
            date: data.date,
            categoryId: data.categoryId,
            shopId: data.shopId,
            sellerId: data.sellerId,
            financeStatus: data.financeStatus,
            financeId: data.financeId,
          },
        },
        update: {
          totalUnitsSold: { increment: data.totalUnitsSold },
          totalRevenue: { increment: data.totalRevenue },
          totalCostOfGoods: { increment: data.totalCostOfGoods },
          grossProfit: { increment: data.grossProfit },
          totalCommission: { increment: data.totalCommission },
          totalfinanceAmount: { increment: data.totalfinanceAmount },
        },
        create: data,
      });
    }

    cursor = sales[sales.length - 1].id;
    page++;
  }

  console.log(`Backfill for ${salesTable} completed.`);
}

async function main() {
  console.log('Starting historical analytics backfill...');
  await backfillSales('mobilesales');
  await backfillSales('accessorysales');
  console.log('Historical analytics backfill finished successfully!');
}

main()
  .catch((e) => {
    console.error('An error occurred during the backfill process:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
