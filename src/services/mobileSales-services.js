import { Sales } from "../databases/repository/sales-repository.js";
import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import { usermanagemenRepository } from "../databases/repository/usermanagement-controller-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { phoneinventoryrepository } from "../databases/repository/mobile-inventory-repository.js";
import { CategoryManagementRepository } from "../databases/repository/category-contoller-repository.js";
import { APIError, STATUS_CODE } from "../Utils/app-error.js";

class MobileSalesService {
  constructor(repositories = {}) {
    this.repositories = {
      user: repositories.user || new usermanagemenRepository(),
      inventory: repositories.inventory || new InventorymanagementRepository(),
      shop: repositories.shop || new ShopmanagementRepository(),
      sales: repositories.sales || new Sales(),
      mobile: repositories.mobile || new phoneinventoryrepository(),
      category: repositories.category || new CategoryManagementRepository(),
    };
  }

  async validateSeller(sellerId, shopName) {
    const [user, assignedShops] = await Promise.all([
      this.repositories.user.findUserById({ id: sellerId }),
      this.repositories.user.findAssignedShop(sellerId),
    ]);

    if (!user) {
      throw new APIError("Seller not found", STATUS_CODE.NOT_FOUND);
    }

    if (user.workingstatus !== "active") {
      throw new APIError(
        `Unauthorized - Account ${user.workingstatus}`,
        STATUS_CODE.UNAUTHORIZED
      );
    }

    const activeAssignment = assignedShops.find(
      (assignment) =>
        assignment.status === "assigned" &&
        assignment.shops.shopName === shopName
    );

    if (!activeAssignment) {
      throw new APIError(
        "Unauthorized to make sales in this shop",
        STATUS_CODE.UNAUTHORIZED
      );
    }

    return user;
  }

  async validateProductAndFinance(stockId, shopName) {
    console.log("Validating product and finance for stockId:", stockId, "in shop:", shopName);
    const [product, shop, finance] = await Promise.all([
      this.repositories.mobile.findItem(stockId),
      this.repositories.shop.findShop({ name: shopName }),
      this.repositories.mobile.findMobileFinance(stockId),
    ]);

    if (!product) {
      throw new APIError("Product not found", STATUS_CODE.NOT_FOUND);
    }

    const shopStockItem = shop.mobileItems.find(
      (item) =>
        item.mobileID === stockId &&
        item.quantity >= 1 &&
        item.status === "confirmed"
    );

    if (!shopStockItem) {
      throw new APIError(
        `Product not available in ${shopName}`,
        STATUS_CODE.BAD_REQUEST,
        `Product not available in ${shopName}`
      );
    }

    return { product, shop, finance };
  }

  async updateInventory(shopId, stockId, soldUnits) {
    await Promise.all([
      this.repositories.shop.updateSalesOfPhone(shopId, stockId, soldUnits),
      this.repositories.mobile.updatesalesofaphone({
        id: stockId,
        sellerId: this.sellerId,
        status: "sold",
      }),
      this.repositories.mobile.updateSoldPhone(stockId),
    ]);
  }

  async recordSaleTransaction(saleData, finance) {
    console.log("salesData", saleData);
    return this.repositories.sales.createnewMobilesales({
      ...saleData,
      salesType: ["cash", "mpesa"].includes(saleData.paymentmethod)
        ? "direct"
        : "finance",
      financeStatus: ["cash", "mpesa"].includes(saleData.paymentmethod)
        ? "paid"
        : "pending",
      financer: ["cash", "mpesa"].includes(saleData.paymentmethod)
        ? "captech limited"
        : finance.financer,
      finance: finance.id,
      financeAmount: finance.financeAmount,
    });
  }

  async processMobileSale(saleDetails) {
    try {
      console.log("Processing mobile sale with details:", saleDetails);
      const {
        productId,
        shopname,
        soldprice,
        seller,
        CategoryId,
        paymentmethod,
        customerId,
        paymentId,
        ...customerDetails
      } = saleDetails;
      // console.log("343@", customerDetails);
      const numericFields = [productId, seller, soldprice, CategoryId];
      if (numericFields.some((field) => isNaN(parseInt(field, 10)))) {
        throw new APIError("Invalid numeric input", STATUS_CODE.BAD_REQUEST);
      }

      const [stockId, sellerId, soldPrice, categoryId] = numericFields.map(
        (f) => parseInt(f, 10)
      );

      const [user, { product, shop, finance }] = await Promise.all([
        this.validateSeller(sellerId, shopname),
        this.validateProductAndFinance(stockId, shopname),
      ]);
      await this.updateInventory(shop.id, stockId, 1);
      const profit = soldPrice - product.productCost - product.commission;

      return this.recordSaleTransaction(
        {
          productID: stockId,
          shopID: shop.id,
          sellerId,
          soldPrice,
          quantity: 1,
          commission: parseInt(product.commission, 10),
          categoryId,
          paymentmethod,
          profit,
          customerId,
          paymentId,
        },
        finance
      );
    } catch (error) {
      console.error("Sales Error:", error);
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        "Internal server error",
        STATUS_CODE.INTERNAL_ERROR,
        error.message
      );
    }
  }
}

export { MobileSalesService };
