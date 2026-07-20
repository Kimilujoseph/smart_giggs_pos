import { PrismaClient } from "@prisma/client";
import { Sales } from "../databases/repository/sales-repository.js";
import { AccessoryInventoryRepository } from "../databases/repository/accessory-inventory-repository.js";
import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import { usermanagemenRepository } from "../databases/repository/usermanagement-controller-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { phoneinventoryrepository } from "../databases/repository/mobile-inventory-repository.js";
import { CategoryManagementRepository } from "../databases/repository/category-contoller-repository.js";
import { AnalyticsRepository } from "../databases/repository/analytics-repository.js";
import { transformSales } from "../helpers/transformsales.js";
import {
  APIError,
  STATUS_CODE,
  NotFoundError,
  BadRequestError,
} from "../Utils/app-error.js";
import CustomerRepository from "../databases/repository/customer-repository.js";
import reportQueue from "../queues/salesReportQueue.js";
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
    this.accessory = new AccessoryInventoryRepository();
  }

  async createBulkSale(salePayload, user) {
    const { shopName, customerdetails, bulksales } = salePayload;
    const { id: sellerId } = user;
    // console.log("customer details", customerdetails);

    const shop = await this.shop.findShop({ name: shopName });
    if (!shop) {
      throw new NotFoundError(`${shopName} shop Not found`);
    }

    let customer = await this.customer.findCustomerByPhone(
      customerdetails.phonenumber
    );
    if (!customer && customerdetails.email) {
      customer = await this.customer.findCustomerByEmail(customerdetails.email);
    }
    if (!customer) {
      const customerData = {
        name: customerdetails.name,
        phoneNumber: customerdetails.phonenumber,
        email: customerdetails.email
          ? customerdetails.email
          : "walkin@gmail.com",
        address: customerdetails.address,
      };
      //console.log("creating new customer with data", customerData);
      customer = await this.customer.createCustomer(customerData);
      //console.log("created new customer", customer);
    }

    return prisma.$transaction(async (tx) => {
      const allSalesResults = [];
      const analyticsAggregator = new Map();

      for (const sale of bulksales) {
        const { itemType, items, payments, CategoryId } = sale;

        if (items.length !== 1) {
          throw new BadRequestError(
            "Each sale submitted  must contain atleast one item."
          );
        }
        const item = items[0];
        const {
          productId,
          soldprice,
          soldUnits,
          itemId,
          financeAmount,
          financeStatus,
          financeId,
        } = item;

        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        if (totalPaid < soldprice) {
          throw new BadRequestError(
            `Total payment (${totalPaid}) is less than the sold price (${soldprice}).`
          );
        }

        const itemToSell =
          itemType === "mobiles"
            ? await this.mobile.findMobileItem(parseInt(itemId), tx)
            : await this.accessory.findAccessoryItemProduct(
              parseInt(itemId),
              tx
            );

        if (!itemToSell) {
          throw new NotFoundError("product sold not found");
        }
        if (itemToSell.status === "sold" && itemToSell.quantity === 0) {
          throw new BadRequestError("Product already sold");
        }

        const categoryDetails = await tx.categories.findUnique({
          where: { id: parseInt(CategoryId) },
        });
        const productDetails =
          itemType === "mobiles"
            ? await this.mobile.findItem(parseInt(productId), tx)
            : await this.accessory.findItem(parseInt(productId), tx);
        if (
          !productDetails ||
          !["available", "distributed"].includes(productDetails.stockStatus)
        ) {
          throw new BadRequestError(
            "the selected product is not available for sale"
          );
        }

        const profit = productDetails.financeId ? margin * soldUnits : soldprice - productDetails.productCost * soldUnits;
        const commission = productDetails.commission * soldUnits;

        const saleData = {
          productID: parseInt(productId),
          shopID: shop.id,
          sellerId,
          soldPrice: soldprice,
          quantity: soldUnits,
          customerId: customer.id,
          categoryId: parseInt(CategoryId),
          profit,
          commission,
          financeAmount: financeAmount ? parseInt(financeAmount) : 0,
          financeStatus: financeStatus,
          financerId: financeId ? parseInt(financeId) : 1,
        };

        let createdSale;
        if (itemType === "mobiles") {
          // createdSale = await tx.mobilesales.create({ data: saleData });
          createdSale = await this.sales.createnewMobilesales(
            { data: saleData },
            tx
          );
          await this.mobile.updateSoldPhoneShopItem(parseInt(itemId), tx);
          await this.mobile.updateSoldPhone(parseInt(itemToSell.mobileID), tx);
          await this.mobile.updatesalesofaphone(
            {
              id: itemToSell.mobileID,
              sellerId: sellerId,
              status: "sold",
            },
            tx
          );
        } else {
          let status =
            itemToSell.quantity - soldUnits > 0 ? "confirmed" : "sold";
          createdSale = await this.sales.createnewAccessoriesales(
            { data: saleData },
            tx
          );
          const updateData = {
            itemId: parseInt(itemId),
            status,
            soldUnits,
          };
          await this.accessory.updateSoldAccessoryItems(updateData, tx);
        }

        const paymentPromises = payments.map((p) => {
          const paymentData = {
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            status: "completed",
            transactionId: p.transactionId,
          };
          if (itemType === "mobiles") {
            paymentData.mobileSaleId = createdSale.id;
          } else {
            paymentData.accessorySaleId = createdSale.id;
          }
          return this.sales.createPayment({ data: paymentData }, tx);
        });

        const createdPayments = await Promise.all(paymentPromises);
        const now = new Date();
        const today = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        const parsedFinanceId = financeId ? parseInt(financeId) : 1;
        const financeIdKey =
          parsedFinanceId === null ? "null" : parsedFinanceId;
        const financeStatusKey =
          financeStatus === null ? "null" : financeStatus;

        const analyticsKey = `${today.toISOString()}-${CategoryId}-${shop.id
          }-${sellerId}-${financeStatusKey}-${financeIdKey}`;

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
        currentAnalytics.totalCostOfGoods +=
          productDetails.productCost * soldUnits;
        currentAnalytics.grossProfit += profit;
        currentAnalytics.totalCommission += commission;
        currentAnalytics.totalfinanceAmount += financeAmount
          ? parseInt(financeAmount)
          : 0;

        analyticsAggregator.set(analyticsKey, currentAnalytics);

        allSalesResults.push({
          status: "fulfilled",
          value: {
            ...createdSale,
            sellerName: user.name,
            customerName: customer.name ? customer.name : "walk-in-customer",
            customerphoneNumber: customer.phoneNumber
              ? customer.phoneNumber
              : "walk-in-customer",
            shopName: shopName,
            batchIMEI:
              itemType === "mobiles"
                ? productDetails.IMEI
                : productDetails.batchNumber,
            productName: categoryDetails.itemName,
            productModel: categoryDetails.itemModel,
            brand: categoryDetails.brand,
            paymentData: createdPayments,
          },
        });
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
              totalfinanceAmount: {
                increment: analyticsData.totalfinanceAmount,
              },
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
  async _getAccountReceivableSummary(salesQueryPayload) {
    const accountRecevible = await this.analytics.getAccountReceivableSummary(salesQueryPayload)
    return accountRecevible
  }

  async _getFinancerCommissionSummary(salesQueryPayload) {
    const commissionAnalysis = await this.analytics.getFinancerCommissionSummary(salesQueryPayload)
    return commissionAnalysis
  }
  //create a queue fro report generateion
  async _createReportQueue(filters) {
    const { startDate, endDate, shopId, userId, categoryId, financerId, financeStatus } = filters

    const JobData = {
      startDate: startDate,
      endDate: endDate,
      shopId: shopId ? parseInt(shopId) : null,
      userId: userId ? parseInt(userId) : null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      financerId: financerId ? parseInt(financerId) : null,
      financeStatus: financeStatus || null,
      requestedAt: new Date().toISOString()
    }
    const Job = await reportQueue.add(`report-${userId}-${Date.now()}`, JobData)
    return Job
  }
  async _getSummarySalesData(filters) {
    //console.log("filters", filters)
    const {
      startDate,
      endDate,
      shopId,
      userId,
      categoryId,
      financerId,
      financeStatus,
    } = filters;
    const today = new Date();
    //convert today to midnight;
    const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const parsedShopId = isNaN(parseInt(shopId)) ? undefined : parseInt(shopId);
    const parsedUserId = isNaN(parseInt(userId)) ? undefined : parseInt(userId);
    const parsedCategoryId = isNaN(parseInt(categoryId)) ? undefined : parseInt(categoryId);
    const parsedFinancerId = isNaN(parseInt(financerId)) ? undefined : parseInt(financerId);

    const historicalEndDate = today > parsedEndDate ? parsedEndDate : today;
    //console.log("historical enddate", historicalEndDate)
    const historicalTotals = await this.analytics.getSalesAnalytics({
      startDate: parsedStartDate,
      endDate: historicalEndDate,
      shopId: parsedShopId,
      sellerId: parsedUserId,
      categoryId: parsedCategoryId,
      financerId: parsedFinancerId,
      financeStatus,
    });
    //console.log("historical totals", historicalTotals)

    //hisrotical data is an array of two object mobile and accessory totals
    let historicalMobileTotals = historicalTotals.filter((item) => item.category === "mobiles")[0];
    let historicalAccessoryTotals = historicalTotals.filter((item) => item.category === "accessories")[0];

    // console.log("historical mobile totals", historicalMobileTotals)
    // console.log("historical accessory totals", historicalAccessoryTotals)

    let todaysMobileTotals = {
      category: "mobile",
      totalRevenue: 0,
      grossProfit: 0,
      totalCommission: 0,
      totalCommissionPaid: 0,
      totalItems: 0,
      totalFinanceAmount: 0,
    };
    let todaysAccessoryTotals = {
      category: "accessory",
      totalRevenue: 0,
      grossProfit: 0,
      totalCommission: 0,
      totalCommissionPaid: 0,
      totalItems: 0,
      totalFinanceAmount: 0,
    };
    if (parsedEndDate >= today) {
      const todaySalesDetails = {
        startDate: today,
        endDate: parsedEndDate,
        shopId: parsedShopId,
        userId: parsedUserId,
        categoryId: parsedCategoryId,
        financerId: parsedFinancerId,
        financeStatus,
        page: 1,
        limit: 150,
      };

      const [mobileSales, accessorySales] = await Promise.all([
        this.sales.findSummarySales({
          ...todaySalesDetails,
          salesTable: "mobilesales",
        }),
        this.sales.findSummarySales({
          ...todaySalesDetails,
          salesTable: "accessorysales",
        }),
      ]);

      //console.log("mobile sales", mobileSales)
      // console.log("accessory sales", accessorySales)
      todaysMobileTotals = {
        category: "mobile",
        totalRevenue:
          (mobileSales._sum.soldPrice || 0),
        grossProfit:
          (mobileSales._sum.profit || 0),
        totalCommission:
          (mobileSales._sum.commission || 0),
        totalItems:
          (mobileSales._count || 0)
      };
      todaysAccessoryTotals = {
        category: "accessory",
        totalRevenue:
          (accessorySales._sum.soldPrice || 0),
        grossProfit:
          (accessorySales._sum.profit || 0),
        totalCommission:
          (accessorySales._sum.commission || 0),
        totalItems:
          (accessorySales._count || 0)
      };
    }

    const finalTotals = {
      totalSales: Number(historicalMobileTotals?.totalRevenue || 0) + Number(todaysMobileTotals.totalRevenue || 0) + Number(historicalAccessoryTotals?.totalRevenue || 0) + Number(todaysAccessoryTotals.totalRevenue || 0),
      totalProfit:
        Number(historicalMobileTotals?.grossProfit || 0) + Number(todaysMobileTotals.grossProfit || 0) + Number(historicalAccessoryTotals?.grossProfit || 0) + Number(todaysAccessoryTotals.grossProfit || 0),
      totalCommission:
        Number(historicalMobileTotals?.totalCommission || 0) +
        Number(todaysMobileTotals.totalCommission || 0) + Number(historicalAccessoryTotals?.totalCommission || 0) + Number(todaysAccessoryTotals.totalCommission || 0),
      totalMobileSales: Number(historicalMobileTotals?.totalRevenue || 0) + Number(todaysMobileTotals.totalRevenue || 0),
      totalAccessorySales: Number(historicalAccessoryTotals?.totalRevenue || 0) + Number(todaysAccessoryTotals.totalRevenue || 0),
      totalMobileProfit: Number(historicalMobileTotals?.grossProfit || 0) + Number(todaysMobileTotals.grossProfit || 0),
      totalAccessoryProfit: Number(historicalAccessoryTotals?.grossProfit || 0) + Number(todaysAccessoryTotals.grossProfit || 0),
      totalMobileCommission: Number(historicalMobileTotals?.totalCommission || 0) + Number(todaysMobileTotals.totalCommission || 0),
      totalAccessoryCommission: Number(historicalAccessoryTotals?.totalCommission || 0) + Number(todaysAccessoryTotals.totalCommission || 0),
    };

    return {
      ...finalTotals
    }
  }

  async _getHybridSalesData(filters) {
    const {
      startDate,
      endDate,
      page,
      limit,
      shopId,
      userId,
      categoryId,
      financerId,
      financeStatus,
      model
    } = filters;

    const today = new Date();
    //today.setHours(0, 0, 0, 0);

    const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const parsedEndDate = endDate ? new Date(endDate) : new Date();

    const parsedShopId = isNaN(parseInt(shopId)) ? undefined : parseInt(shopId);
    const parsedUserId = isNaN(parseInt(userId)) ? undefined : parseInt(userId);
    const parsedCategoryId = isNaN(parseInt(categoryId)) ? undefined : parseInt(categoryId);
    const parsedFinancerId = isNaN(parseInt(financerId)) ? undefined : parseInt(financerId);
    const parsedPage = isNaN(parseInt(page)) ? 1 : parseInt(page);
    const parsedLimit = isNaN(parseInt(limit)) ? 10000 : parseInt(limit);

    const paginatedSalesDetails = {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      shopId: parsedShopId,
      userId: parsedUserId,
      categoryId: parsedCategoryId,
      financerId: parsedFinancerId,
      financeStatus,
      page: parsedPage,
      limit: parsedLimit,
    };

    let salesTable = model === "mobiles" ? "mobilesales" : "accessorysales"

    const salesFoundForATable = await Promise.all([
      parsedUserId
        ? this.sales.findUserSales({
          ...paginatedSalesDetails,
          salesTable: salesTable,
        })
        : this.sales.findSales({
          ...paginatedSalesDetails,
          salesTable: salesTable,
        })
    ]);

    //console.log("sales found for a table", salesFoundForATable)

    salesFoundForATable.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalItemsForPagination =
      (salesFoundForATable[0].totals.totalItems || 0);

    return {
      sales: {
        sales: salesFoundForATable[0].data.map(transformSales),
        totalPages: Math.ceil(totalItemsForPagination / parsedLimit),
        currentPage: parsedPage,
      },

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
      console.log(err)
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
      const salesTable =
        saleType === "mobile" ? "mobilesales" : "accessorysales";

      if (!["paid", "pending", "overdue"].includes(status)) {
        throw new APIError(
          "Bad Request",
          STATUS_CODE.BAD_REQUEST,
          "Invalid status provided."
        );
      }

      const updatedSale = await this.sales.updateFinanceStatus({
        salesTable,
        saleId: parseInt(saleId, 10),
        status,
      });

      return {
        message: "Finance status updated successfully.",
        sale: updatedSale,
      };
    } catch (err) {
      this.handleServiceError(err);
    }
  }

  async getReportStatus(jobId) {
    const job = await reportQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundError("Job not found");
    }
    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    return { id: job.id, state, progress, result };
  }
}

export { salesmanagment };
