import { PrismaClient } from '@prisma/client';
import { APIError, STATUS_CODE } from '../../Utils/app-error.js';

import prisma from "../../databases/client.js"

class ReturnRepository {
  async createReturn(returnData) {
    const {
      saleId,
      saleType,
      reason,
      refundAmount,
      restock,
      processedById,
      customerId,
      quantity, // The quantity of items being returned
    } = returnData;

    return prisma.$transaction(async (tx) => {
      const saleModel = saleType === 'mobile' ? tx.mobilesales : tx.accessorysales;
      const itemModel = saleType === 'mobile' ? tx.mobileItems : tx.accessoryItems;
      const productModel = saleType === 'mobile' ? tx.mobiles : tx.accessories;


      const originalSale = await saleModel.findUnique({
        where: { id: saleId },
      });

      if (!originalSale) {
        throw new APIError('Not Found', STATUS_CODE.NOT_FOUND, `Original ${saleType} sale with ID ${saleId} not found.`);
      }
      if (originalSale.status === 'RETURNED') {
        throw new APIError('Bad Request', STATUS_CODE.BAD_REQUEST, 'This sale has already been fully returned.');
      }
      if (!quantity || quantity <= 0) {
        throw new APIError('Bad Request', STATUS_CODE.BAD_REQUEST, 'Return quantity must be greater than zero.');
      }
      if (quantity > originalSale.quantity) {
        throw new APIError('Bad Request', STATUS_CODE.BAD_REQUEST, `Cannot return ${quantity} items. Only ${originalSale.quantity} available to return.`);
      }


      const returnRecord = await tx.return.create({
        data: {
          reason,
          refundAmount,
          restock,
          processedBy: processedById,
          customerId: customerId || 1,
          ...(saleType === 'mobile' ? { mobileSaleId: saleId } : { accessorySaleId: saleId }),
        },
      })
      const originalQuantity = Number(originalSale.quantity);
      const pricePerUnit = Number(originalSale.soldPrice) / originalQuantity;
      const profitPerUnit = Number(originalSale.profit) / originalQuantity;
      const commissionPerUnit = Number(originalSale.commission) / originalQuantity;
      const financeAmountPerUnit = Number(originalSale.financeAmount) / originalQuantity;

      const revenueToReverse = pricePerUnit * quantity;
      const profitToReverse = profitPerUnit * quantity;
      const commissionToReverse = commissionPerUnit * quantity;
      const financeAmountToReverse = financeAmountPerUnit * quantity;


      const newSaleQuantity = originalQuantity - quantity;
      await saleModel.update({
        where: { id: saleId },
        data: {
          quantity: newSaleQuantity,
          status: newSaleQuantity > 0 ? 'PARTIALLY_RETURNED' : 'RETURNED',
          soldPrice: { decrement: revenueToReverse },
          profit: { decrement: profitToReverse },
          commissionPaid: { decrement: commissionToReverse },
          commission: { decrement: commissionToReverse },
          financeAmount: { decrement: financeAmountToReverse },
        },
      });


      if (restock) {
        if (saleType === 'mobile') {

          const soldItem = await tx.mobileItems.findFirst({
            where: { mobileID: originalSale.productID, shopID: originalSale.shopID, status: 'sold' },
          });
          if (soldItem) {
            await tx.mobileItems.update({ where: { id: soldItem.id }, data: { status: 'available' } });
            await tx.mobiles.update({ where: { id: originalSale.productID }, data: { stockStatus: "distributed" } })
          }
          await productModel.update({ where: { id: originalSale.productID }, data: { availableStock: { increment: 1 } } });
        } else if (saleType === 'accessory') {
          await tx.accessoryItems.updateMany({
            where: { accessoryID: originalSale.productID, shopID: originalSale.shopID },
            data: { quantity: { increment: quantity } },
          });
          await productModel.update({ where: { id: originalSale.productID }, data: { availableStock: { increment: quantity } } });
        }
      }


      const productDetails = await productModel.findUnique({ where: { id: originalSale.productID } });
      const costPerUnit = Number(productDetails.productCost);
      const costToReverse = costPerUnit * quantity;
      const now = new Date();
      const returnDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      const financeStatusForReturn = `RETURNED: ${originalSale.financeStatus}`;

      const existingRecord = await tx.dailySalesAnalytics.findUnique({
        where: {
          date_categoryId_shopId_sellerId_financeId_financeStatus: {
            date: returnDate,
            categoryId: originalSale.categoryId,
            shopId: originalSale.shopID,
            sellerId: originalSale.sellerId,
            financeId: originalSale.financerId,
            financeStatus: financeStatusForReturn,
          },
        },
      });
      //console.log("existingRecord", existingRecord)
      if (existingRecord) {
        await tx.dailySalesAnalytics.update({
          where: {
            id: existingRecord.id,
          },
          data: {
            totalUnitsSold: { decrement: quantity },
            totalRevenue: { decrement: revenueToReverse },
            totalCostOfGoods: { decrement: costToReverse },
            grossProfit: { decrement: profitToReverse },
            totalCommission: { decrement: commissionToReverse },
            totalfinanceAmount: { decrement: financeAmountToReverse },
          },
        });
      } else {
        await tx.dailySalesAnalytics.create({
          data: {
            date: returnDate,
            categoryId: originalSale.categoryId,
            shopId: originalSale.shopID,
            sellerId: originalSale.sellerId,
            financeId: originalSale.financerId,
            financeStatus: financeStatusForReturn,
            totalUnitsSold: -quantity,
            totalRevenue: -revenueToReverse,
            totalCostOfGoods: -costToReverse,
            grossProfit: -profitToReverse,
            totalCommission: -commissionToReverse,
            totalfinanceAmount: -financeAmountToReverse,
          },
        });
      }
      return returnRecord;
    });
  }
}

export { ReturnRepository };