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
          financerId: financeId ? parseInt(financeId) : null,
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
        const parsedFinanceId = financeId ? parseInt(financeId) : null;
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
    } = filters;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parsedStartDate = startDate;
    const parsedEndDate = endDate;

    //console.log("parsed start date", parsedStartDate, "parsed end date", parsedEndDate)

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


    //hisrotical data is an array of two object mobile and accessory totals
    let historicalMobileTotals = historicalTotals.filter((item) => item.category === "mobiles")[0];
    let historicalAccessoryTotals = historicalTotals.filter((item) => item.category === "accessories")[0];

    console.log("historical mobile totals", historicalMobileTotals)
    console.log("historical accessory totals", historicalAccessoryTotals)

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
        shopId,
        userId,
        categoryId,
        financerId,
        financeStatus,
        page: 1,
        limit: 150, // A large limit to get all of today's sales
      };

      const [mobileSales, accessorySales] = await Promise.all([
        this.sales.findSales({
          ...todaySalesDetails,
          salesTable: "mobilesales",
        }),
        this.sales.findSales({
          ...todaySalesDetails,
          salesTable: "accessorysales",
        }),
      ]);

      // console.log("3433434544545", accessorySales)
      // console.log("3433434544mobile545", mobileSales)

      todaysMobileTotals = {
        category: "mobile",
        totalRevenue:
          (mobileSales.totals.totalSales || 0),
        grossProfit:
          (mobileSales.totals.totalProfit || 0),
        totalCommission:
          (mobileSales.totals.totalCommission || 0),
        totalItems:
          (mobileSales.totals.totalItems || 0)
      };
      todaysAccessoryTotals = {
        category: "accessory",
        totalRevenue:
          (accessorySales.totals.totalSales || 0),
        grossProfit:
          (accessorySales.totals.totalProfit || 0),
        totalCommission:
          (accessorySales.totals.totalCommission || 0),
        totalItems:
          (accessorySales.totals.totalItems || 0)
      };
    }

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
        ? this.sales.findUserSales({
          ...paginatedSalesDetails,
          salesTable: "mobilesales",
        })
        : this.sales.findSales({
          ...paginatedSalesDetails,
          salesTable: "mobilesales",
        }),
      userId
        ? this.sales.findUserSales({
          ...paginatedSalesDetails,
          salesTable: "accessorysales",
        })
        : this.sales.findSales({
          ...paginatedSalesDetails,
          salesTable: "accessorysales",
        }),
    ]);

    const combinedSales = [
      ...paginatedMobileSales.data,
      ...paginatedAccessorySales.data,
    ];

    combinedSales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const paginatedSales = combinedSales.slice(0, limit);
    // console.log("@@@@@", paginatedSales)
    const totalItemsForPagination =
      (paginatedMobileSales.totals.totalItems || 0) +
      (paginatedAccessorySales.totals.totalItems || 0);

    // 4. Combine totals for the final analytics object
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
      //console.log("filter when fetching general sales ", filters)
      return await this._getHybridSalesData(filters);
    } catch (err) {
      this.handleServiceError(err);
    }
  }

  async getUserSales(filters) {
    try {
      console.log("get user sales called", filters);
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
}

export { salesmanagment };
