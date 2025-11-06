import { PrismaClient } from "@prisma/client";
import { Sales } from "../databases/repository/sales-repository.js";
import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import { usermanagemenRepository } from "../databases/repository/usermanagement-controller-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { phoneinventoryrepository } from "../databases/repository/mobile-inventory-repository.js";
import { CategoryManagementRepository } from "../databases/repository/category-contoller-repository.js";
import { AnalyticsRepository } from "../databases/repository/analytics-repository.js";
import { transformSales } from "../helpers/transformsales.js";
import { APIError, STATUS_CODE } from "../Utils/app-error.js";
import CustomerRepository from "../databases/repository/customer-repository.js";

const prisma = new PrismaClient();

class salesmanagment {
  constructor() {
    this.user = new usermanagemenRepository();
    this.inventory = new InventorymanagementRepository();
    this.shop = new ShopmanagementRepository();
    this.sales = new Sales();
    this.analytics = new AnalyticsRepository();
    this.mobile = new phoneinventoryrepository();
    this.category = new CategoryManagementRepository();
    this.customer = CustomerRepository;
  }

  async createBulkSale(salePayload, user) {
    const { shopName, customerdetails, bulksales } = salePayload;
    const { id: sellerId } = user;
    //console.log("bulk sales@@@@@@", JSON.stringify(salePayload))
    const shop = await this.shop.findShop({ name: shopName });
    if (!shop) {
      throw new APIError("Shop not found", STATUS_CODE.NOT_FOUND, "The specified shop does not exist.");
    }

    let customer = await this.customer.findCustomerByPhone(customerdetails.phonenumber) || await this.customer.findCusomerByEmail(customerdetails.email);
    if (!customer) {
      const customerData = {
        name: customerdetails.name,
        phoneNumber: customerdetails.phonenumber,
        email: customerdetails.email,
        address: customerdetails.address,
      };
      customer = await this.customer.createCustomer(customerData);
    }

    return prisma.$transaction(async (tx) => {
      const allSalesResults = [];
      const analyticsAggregator = new Map();

      for (const sale of bulksales) {
        const { itemType, items, paymentmethod, transactionId, CategoryId } = sale;

        const totalAmount = items.reduce((acc, item) => acc + (item.soldprice * 1), 0);

        const payment = await tx.payment.create({
          data: {
            amount: totalAmount,
            paymentMethod: paymentmethod,
            status: 'completed',
            transactionId: transactionId,
            updatedAt: new Date(),
          },
        });

        for (const item of items) {
          const { productId, soldprice, soldUnits, itemId, financeAmount, financeStatus, financeId } = item;

          const itemToSell = itemType === 'mobiles'
            ? await tx.mobileItems.findUnique({ where: { id: parseInt(itemId) } })
            : await tx.accessoryItems.findUnique({ where: { id: parseInt(itemId) } });

          if (!itemToSell) {
            throw new APIError("Not Found", STATUS_CODE.NOT_FOUND, "Item not found.");
          }
          if (itemToSell.status === 'sold' && itemToSell.quantity === 0) {
            throw new APIError("Bad Request", STATUS_CODE.BAD_REQUEST, "Item has already been sold.");
          }
          const categoryDetails = await tx.categories.findUnique({ where: { id: parseInt(CategoryId) } })
          const productDetails = itemType === 'mobiles'
            ? await tx.mobiles.findUnique({ where: { id: parseInt(productId) } })
            : await tx.accessories.findUnique({ where: { id: parseInt(productId) } });

          if (!productDetails) {
            throw new APIError("Not Found", STATUS_CODE.NOT_FOUND, `Product with ID ${productId} not found`);
          }

          const profit = soldprice - (productDetails.productCost * soldUnits);
          const commission = productDetails.commission * soldUnits;

          const saleData = {
            productID: parseInt(productId),
            shopID: shop.id,
            sellerId,
            soldPrice: soldprice,
            quantity: soldUnits,
            customerId: customer.id,
            paymentId: payment.id,
            categoryId: parseInt(CategoryId),
            profit,
            commission,
            financeAmount: financeAmount ? parseInt(financeAmount) : 0,
            financeStatus: financeStatus,
            financerId: financeId ? parseInt(financeId) : null,
          };

          //console.log("#$receiving sales Data", saleData)

          let createdSale;
          if (itemType === 'mobiles') {
            const updateId = itemToSell.id;
            createdSale = await tx.mobilesales.create({ data: saleData });
            //console.log("sales created", createdSale)
            await tx.mobileItems.updateMany({
              where: { id: updateId },
              data: { status: "sold", quantity: { decrement: soldUnits } },
            });

            await tx.mobiles.update({
              where: { id: parseInt(itemToSell.mobileID) },
              data: { stockStatus: "sold" }
            })
          } else {
            const updateId = itemToSell.id;
            createdSale = await tx.accessorysales.create({ data: saleData });

            await tx.accessoryItems.update({
              where: { id: updateId },
              data: { status: itemToSell.quantity - soldUnits > 0 ? "confirmed" : "sold", quantity: { decrement: soldUnits } },
            });
          }


          const now = new Date();
          const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const parsedFinanceId = financeId ? parseInt(financeId) : null;
          const financeIdKey = parsedFinanceId === null ? 'null' : parsedFinanceId;
          const financeStatusKey = financeStatus === null ? 'null' : financeStatus;

          const analyticsKey = `${today.toISOString()}-${CategoryId}-${shop.id}-${sellerId}-${financeStatusKey}-${financeIdKey}`;

          const currentAnalytics = analyticsAggregator.get(analyticsKey) || {
            date: today,
            categoryId: parseInt(CategoryId),
            shopId: shop.id,
            sellerId: sellerId,
            financeStatus: financeStatus,
            financeId: parsedFinanceId,
            totalUnitsSold: 0,
            totalRevenue: 0,
            totalCostOfGoods: 0,
            grossProfit: 0,
            totalCommission: 0,
            totalfinanceAmount: 0,
          };

          currentAnalytics.totalUnitsSold += soldUnits;
          currentAnalytics.totalRevenue += soldprice;
          currentAnalytics.totalCostOfGoods += productDetails.productCost * soldUnits;
          currentAnalytics.grossProfit += profit;
          currentAnalytics.totalCommission += commission;
          currentAnalytics.totalfinanceAmount += financeAmount ? parseInt(financeAmount) : 0;

          analyticsAggregator.set(analyticsKey, currentAnalytics);

          allSalesResults.push({
            status: 'fulfilled',
            value: {
              ...createdSale,
              sellerName: user.name,
              customerName: customer.name ? customer.name : "walk-in-customer",
              customerphoneNumber: customer.phoneNumber ? customer.phoneNumber : "walk-in-customer",
              shopName: shopName,
              batchIMEI: productDetails.batchNumber ? productDetails.batchNumber : productDetails,
              productName: categoryDetails.itemName,
              productModel: categoryDetails.itemModel,
              brand: categoryDetails.brand
            }
          });
        }
      }

      // Perform a find-then-update/create for each aggregated analytic entry
      for (const analyticsData of analyticsAggregator.values()) {
        const existingRecord = await tx.dailySalesAnalytics.findUnique({
          where: {
            date_categoryId_shopId_sellerId_financeId_financeStatus: {
              date: analyticsData.date,
              categoryId: analyticsData.categoryId,
              shopId: analyticsData.shopId,
              sellerId: analyticsData.sellerId,
              financeStatus: analyticsData.financeStatus,
              financeId: analyticsData.financeId,
            },
          },
        });
        if (existingRecord) {
          // If record exists, update it
          await tx.dailySalesAnalytics.update({
            where: {
              id: existingRecord.id,
            },
            data: {
              totalUnitsSold: { increment: analyticsData.totalUnitsSold },
              totalRevenue: { increment: analyticsData.totalRevenue },
              totalCostOfGoods: { increment: analyticsData.totalCostOfGoods },
              grossProfit: { increment: analyticsData.grossProfit },
              totalCommission: { increment: analyticsData.totalCommission },
              totalfinanceAmount: { increment: analyticsData.totalfinanceAmount },
            },
          });
        } else {
          await tx.dailySalesAnalytics.create({
            data: analyticsData,
          });
        }
      }
      //console.log(allSalesResults)
      return allSalesResults;
    });
  }

  async _getHybridSalesData(filters) {
    const { startDate, endDate, page, limit, shopId, userId, categoryId, financerId, financeStatus } = filters;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);


    const historicalEndDate = parsedEndDate < today ? parsedEndDate : today;
    const historicalTotals = await this.analytics.getSalesAnalytics({
      startDate: parsedStartDate,
      endDate: historicalEndDate,
      shopId,
      sellerId: userId,
      categoryId,
      financerId,
      financeStatus,
    });

    //console.log("historical  sales data", historicalTotals)
    let todaysTotals = { totalRevenue: 0, grossProfit: 0, totalCommission: 0, totalCommissionPaid: 0, totalItems: 0, totalFinanceAmount: 0 };
    if (parsedEndDate >= today) {
      const todaySalesDetails = {
        startDate: today,
        endDate: parsedEndDate,
        shopId,
        userId,
        categoryId,
        financerId,
        financeStatus,
        page: 1,
        limit: 10000, // A large limit to get all of today's sales
      };

      const [mobileSales, accessorySales] = await Promise.all([
        this.sales.findSales({ ...todaySalesDetails, salesTable: 'mobilesales' }),
        this.sales.findSales({ ...todaySalesDetails, salesTable: 'accessorysales' }),
      ]);

      // console.log("3433434544545", accessorySales)
      // console.log("3433434544mobile545", mobileSales)

      todaysTotals = {
        totalRevenue: (mobileSales.totals.totalSales || 0) + (accessorySales.totals.totalSales || 0),
        grossProfit: (mobileSales.totals.totalProfit || 0) + (accessorySales.totals.totalProfit || 0),
        totalCommission: (mobileSales.totals.totalCommission || 0) + (accessorySales.totals.totalCommission || 0),
        //totalCommissionPaid: (mobileSales.totals.totalCommissionPaid || 0) + (accessorySales.totals.totalCommissionPaid || 0),
        totalItems: (mobileSales.totals.totalItems || 0) + (accessorySales.totals.totalItems || 0),
        //totalFinanceAmount: (mobileSales.totals.financeAmount || 0) + (accessorySales.totals.financeAmount || 0),
      };
    }

    // 3. Get paginated sales data for the view (from transactional tables)
    const paginatedSalesDetails = {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      shopId,
      userId,
      categoryId,
      financerId,
      financeStatus,
      page,
      limit,
    };

    const [paginatedMobileSales, paginatedAccessorySales] = await Promise.all([
      userId
        ? this.sales.findUserSales({ ...paginatedSalesDetails, salesTable: 'mobilesales' })
        : this.sales.findSales({ ...paginatedSalesDetails, salesTable: 'mobilesales' }),
      userId
        ? this.sales.findUserSales({ ...paginatedSalesDetails, salesTable: 'accessorysales' })
        : this.sales.findSales({ ...paginatedSalesDetails, salesTable: 'accessorysales' }),
    ]);

    const combinedSales = [...paginatedMobileSales.data, ...paginatedAccessorySales.data];
    combinedSales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedSales = combinedSales.slice(0, limit);
    const totalItemsForPagination = (paginatedMobileSales.totals.totalItems || 0) + (paginatedAccessorySales.totals.totalItems || 0);

    // 4. Combine totals for the final analytics object
    const finalTotals = {
      totalSales: (historicalTotals.totalRevenue || 0) + (todaysTotals.totalRevenue || 0),
      totalProfit: (historicalTotals.grossProfit || 0) + (todaysTotals.grossProfit || 0),
      totalCommission: (historicalTotals.totalCommission || 0) + (todaysTotals.totalCommission || 0),
      //totalCommissionPaid: (historicalTotals.totalCommissionPaid || 0) + (todaysTotals.totalCommissionPaid || 0),
      // totalFinanceAmount: (historicalTotals.totalfinanceAmount || 0) + (todaysTotals.totalFinanceAmount || 0),
    };

    return {
      sales: {
        sales: paginatedSales.map(transformSales),
        totalPages: Math.ceil(totalItemsForPagination / limit),
        currentPage: page,
        ...finalTotals,
      },
      analytics: finalTotals,
    };
  }

  async generategeneralsales(filters) {
    try {
      return await this._getHybridSalesData(filters);
    } catch (err) {
      this.handleServiceError(err);
    }
  }

  async getUserSales(filters) {
    try {

      return await this._getHybridSalesData(filters);
    } catch (err) {
      //console.log(err)
      this.handleServiceError(err);
    }
  }

  async generateCategorySales(filters) {
    try {
      return await this._getHybridSalesData(filters);
    } catch (err) {
      this.handleServiceError(err);
    }
  }

  async generateShopSales(filters) {
    try {
      return await this._getHybridSalesData(filters);
    } catch (err) {
      this.handleServiceError(err);
    }
  }

  async generateFinancerSales(filters) {
    try {
      return await this._getHybridSalesData(filters);
    } catch (err) {
      this.handleServiceError(err);
    }
  }

  handleServiceError(err) {
    if (err instanceof APIError) {
      throw err;
    }
    throw new APIError(
      "internal_error",
      STATUS_CODE.INTERNAL_ERROR,
      err.message || "Internal server error"
    );
  }

  async updateFinanceStatus({ saleType, saleId, status }) {
    try {
      const salesTable = saleType === 'mobile' ? 'mobilesales' : 'accessorysales';

      if (!['paid', 'pending', 'overdue'].includes(status)) {
        throw new APIError("Bad Request", STATUS_CODE.BAD_REQUEST, "Invalid status provided.");
      }

      const updatedSale = await this.sales.updateFinanceStatus({
        salesTable,
        saleId: parseInt(saleId, 10),
        status,
      });

      return { message: "Finance status updated successfully.", sale: updatedSale };

    } catch (err) {
      this.handleServiceError(err);
    }
  }
}

export { salesmanagment };