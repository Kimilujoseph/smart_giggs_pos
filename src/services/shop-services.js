import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { usermanagemenRepository } from "../databases/repository/usermanagement-controller-repository.js";
import { InvetorymanagementService } from "./invetory-controller-services.js";
import { MobilemanagementService } from "./mobile-controller-service.js";
import { APIError, STATUS_CODE, NotFoundError } from "../Utils/app-error.js";

class ShopmanagementService {
  constructor() {
    this.repository = new ShopmanagementRepository();
    this.user = new usermanagemenRepository();
    this.inventory = new InvetorymanagementService();
    this.mobile = new MobilemanagementService();
  }
  async createshop(shopdetails) {
    try {
      const { name, address } = shopdetails;

      //check if the shop exist
      const shopExist = await this.repository.findShop({ name });
      if (!shopExist) {
        const newShop = await this.repository.createShop({ name, address });
        return newShop;
      } else {
        throw new APIError(
          "Shop already exist",
          STATUS_CODE.BAD_REQUEST,
          "Shop already exist"
        );
      }
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError("Data not found", STATUS_CODE.INTERNAL_ERROR, err);
    }
  }

  async findSpecificShop({ name, page, limit, status, itemType }) {

    const shopFound = await this.repository.findShop({ name });

    if (!shopFound) {
      throw new NotFoundError("shop does not exist")
    }

    const assignedSellers = shopFound.assignment
      .filter((assignment) => assignment.status === "assigned")
      .map((seller) => ({
        id: seller.id,
        sellerId: seller.actors.id,
        assignmentId: seller.id,
        name: seller.actors.name,
        phone: seller.actors.phone,
        fromDate: seller.fromDate,
        toDate: seller.toDate,
        status: seller.status,
      }));

    let mobileItems = { items: [], totalPages: 0, currentPage: page, totalItems: 0 };
    let accessoryItems = { items: [], totalPages: 0, currentPage: page, totalItems: 0 };

    if (itemType === 'mobile' || itemType === 'all' || !itemType) {
      mobileItems = await this.repository.findSpecificShopItem({
        shopID: shopFound.id,
        requestedItem: 'mobileItems',
        page,
        limit,
        status
      });
    }
    //console.log('mobileItems', JSON.stringify(mobileItems, null, 2))

    if (itemType === 'accessory' || itemType === 'all' || !itemType) {
      accessoryItems = await this.repository.findSpecificShopItem({
        shopID: shopFound.id,
        requestedItem: 'accessoryItems',
        page,
        limit,
        status
      });
    }

    const filteredShop = {
      _id: shopFound.id.toString(),
      name: shopFound.shopName,
      address: shopFound.address,
      sellers: assignedSellers,
      mobileItems: mobileItems,
      accessoryItems: accessoryItems,
    };
    // console.log('filteredShop', JSON.stringify(filteredShop, null, 2))
    return {
      filteredShop: filteredShop,
    };
  }

  async findAllShop() {
    try {
      const allShops = await this.repository.findShopsAvailable();
      return allShops;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }

      throw new APIError(
        "Shops not found",
        STATUS_CODE.INTERNAL_ERROR,
        "internal server error"
      );
    }
  }

  async findSpecificShopItem({ name, requestedItem, page, limit, status }) {
    try {
      const foundResult = await this.repository.findSpecificShopItem({
        name,
        requestedItem,
        page,
        limit,
        status
      });
      return foundResult;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  async updateShop(shopID, shopDetails) {
    try {
      const updatedPhone = await this.repository.updateShopDetails(
        shopID,
        shopDetails
      );

      return updatedPhone;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  async confirmArrival(userId, shopname, productId, transferId) {
    try {
      let shopId;
      const findShop = await this.repository.findShop({ name: shopname });
      if (!findShop) {
        throw new APIError(
          "not found",
          STATUS_CODE.NOT_FOUND,
          "shop not found"
        );
      }
      shopId = findShop.id;
      //confirm if the seller is assigned so as to confirm arrival
      const sellerAssinged = findShop.sellers.find(
        (seller) => seller._id.toString() === userId.toString()
      );
      if (!sellerAssinged) {
        throw new APIError(
          "Unauthorized",
          STATUS_CODE.UNAUTHORIZED,
          "You are not authorized to confirm arrival"
        );
      }

      //check if the product is available awaiting for confirmation

      const productAvailableAwaiting = findShop.newAccessory.find(
        (product) => product.transferId === transferId
      );
      if (!productAvailableAwaiting) {
        throw new APIError(
          "not found",
          STATUS_CODE.NOT_FOUND,
          "delivery not found"
        );
      }

      let quantity = productAvailableAwaiting.quantity;

      if (productAvailableAwaiting.status === "confirmed") {
        throw new APIError(
          "bad request",
          STATUS_CODE.BAD_REQUEST,
          "product already confirmed"
        );
      }

      const inventoryConfirm = await this.inventory.confirmDistribution({
        shopId,
        userId,
        productId,
        quantity,
        transferId,
      });
      return inventoryConfirm;
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }
  async assignSeller({ name, fromDate, toDate, shopname }) {
    try {
      const shop = await this.repository.findShop({ name: shopname });
      if (!shop) {
        throw new APIError(
          "not found",
          STATUS_CODE.NOT_FOUND,
          "shop not found"
        );
      }
      const user = await this.user.findUserByname({ name: name });
      const sellerId = user.id;
      const type = "assigned";

      const shopId = shop.id;
      console.log(shop.assignment);
      const sellerAssigned = shop.assignment.some(
        (assignment) =>
          assignment.actors.id === sellerId && assignment.status === "assigned"
      );
      if (sellerAssigned) {
        throw new APIError(
          "service error",
          STATUS_CODE.BAD_REQUEST,
          "USER ALREADY ASSIGNED"
        );
      }

      //commit the assignment
      const assignment = await this.user.updateUserAssignment({
        sellerId,
        shopId,
        fromDate,
        toDate,
        type,
      });
      return {
        message: "seller assigned successfully",
      };
    } catch (err) {
      console.log("service error", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  //remove seller from the shop

  async removeassignment({ assignmentId }) {
    try {
      const assignment = await this.user.removeUserAssignment(assignmentId);

      return { message: "success" };
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }
  async getShopStockOverview({ name }) {
    try {
      const { mobileItems, accessoryItems, lowStockMobiles, lowStockAccessories } = await this.repository.getShopStockOverviewData({ name });

      let totalCost = 0;
      let pendingValue = 0;
      let confirmedValue = 0;
      const categoryQuantities = {};

      const processItems = (items, itemType) => {
        items.forEach(item => {
          const cost = itemType === 'mobile' ? item.mobiles.productCost : item.accessories.productCost;
          const category = itemType === 'mobile' ? item.mobiles.categories.itemName : item.accessories.categories.itemName;

          const itemValue = cost * item.quantity;
          totalCost += itemValue;

          if (item.status === 'pending') {
            pendingValue += itemValue;
          } else if (item.status === 'confirmed') {
            confirmedValue += itemValue;
          }

          if (category) {
            categoryQuantities[category] = (categoryQuantities[category] || 0) + item.quantity;
          }
        });
      };

      processItems(mobileItems, 'mobile');
      processItems(accessoryItems, 'accessory');

      return {
        totalStockValue: totalCost,
        pendingStockValue: pendingValue,
        confirmedStockValue: confirmedValue,
        lowStockItems: {
          mobiles: lowStockMobiles,
          accessories: lowStockAccessories,
        },
        stockByCategory: categoryQuantities,
      };
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }

  async findproductbysearch(shopName, productName, page, limit) {
    try {
      const products = await this.repository.searchProductName(
        productName,
        shopName,
        page,
        limit
      );
      // The repository will now return a paginated structure,
      // so the check for empty items should be done on the items array inside.
      if (
        products.phoneItems.items.length === 0 &&
        products.stockItems.items.length === 0
      ) {
        throw new APIError(
          "No products found",
          STATUS_CODE.NOT_FOUND,
          "product not found"
        );
      }
      return products;
    } catch (err) {
      console.log("err", err);
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        "Service Error",
        STATUS_CODE.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  }
}

export { ShopmanagementService };
