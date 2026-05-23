import { InventorymanagementRepository } from "../databases/repository/invetory-controller-repository.js";
import { ShopmanagementRepository } from "../databases/repository/shop-repository.js";
import { APIError, STATUS_CODE, ValidationError, NotFoundError, AuthorizationError } from "../Utils/app-error.js";
import prisma from "../databases/client.js";

class ConfirmAccessorymanagementService {
  constructor(repository = {}) {
    this.repository = {
      inventory: repository.inventory || new InventorymanagementRepository(),
      shop: repository.shop || new ShopmanagementRepository(),
    };
  }
  async confirmDistribution(confirmdeliverydetails) {

    const { id, shopname, userId, productId, quantity, transferId } =
      confirmdeliverydetails;

    const [
      accessoryItemId,
      stockId,
      transferproductId,
      parsedQuantity,
      parsedTransferId,
      parsedUserId,
    ] = [
        parseInt(id, 10),
        parseInt(productId, 10),
        parseInt(transferId, 10),
        parseInt(quantity, 10),
        parseInt(transferId, 10),
        parseInt(userId, 10),
      ];

    if (
      [accessoryItemId,
        stockId,
        transferproductId,
        parsedQuantity,
        parsedTransferId,
        parsedUserId,
      ].some(isNaN)
    ) {
      throw new ValidationError("invalid values provided")
    }

    await prisma.$transaction(async (tx) => {
      let [accessoryProduct, shopAccessoryItem, shopFound] = await Promise.all([
        this.repository.inventory.findProductById(stockId, tx),
        this.repository.inventory.findAccessoryItemProduct(accessoryItemId, tx),
        this.repository.shop.findShop({ name: shopname }, tx),
      ]);

      this.validationProcess(accessoryProduct, shopFound, parsedUserId);
      const newAccessory = this.findTheAccessory(
        shopAccessoryItem,
        shopFound,
        parsedTransferId,
        parsedQuantity
      );
      const shopId = parseInt(shopFound.id);
      const accessoryId = newAccessory.accessoryID;
      await this.transferProcess(
        parsedTransferId,
        parsedUserId,
        shopId,
        accessoryItemId,
        tx
      );
    });

  }

  validationProcess(accessoryProduct, shopFound, parsedUserId) {
    if (!accessoryProduct) {
      throw new NotFoundError("accessory product not found")
    }
    if (["deleted", "suspended"].includes(accessoryProduct.stockStatus)) {
      throw new ValidationError(
        `this product is ${accessoryProduct.stockStatus}`
      );
    }
    if (!shopFound) {
      throw new NotFoundError("SHOP NOT FOUND");
    }
    if (
      !shopFound.assignment.some((seller) => seller.actors.id === parsedUserId)
    ) {
      throw new AuthorizationError(
        "You are not authorized to confirm arrival"
      );
    }
  }

  findTheAccessory(newAccessory, shopFound, parsedTransferId, quantity) {

    if (!newAccessory) {
      throw new NotFoundError(
        " NEW ACCESSORY  NOT FOUND"
      );
    }
    if (newAccessory.status === "confirmed" && newAccessory.shopID !== shopFound.id && newAccessory.transferId !== parsedTransferId) {
      throw new ValidationError(
        "Accessory product is not available for confirmation."
      );
    }

    if (newAccessory.quantity < quantity) {
      throw new ValidationError(
        "The quantity being confirmed exceeds the quantity that was transferred."
      );
    }
    return newAccessory;
  }

  async transferProcess(parsedTransferId, parsedUserId, shopId, accessoryId, tx) {
    const updates = {
      status: "confirmed",
      confirmedBy: parsedUserId,
      updatedAt: new Date(),
    };
    await Promise.all([
      this.repository.inventory.updateTransferHistory(
        parsedTransferId,
        updates,
        tx
      ),
      this.repository.shop.updateConfirmationOfAccessory(
        shopId,
        parsedTransferId,
        parsedUserId,
        accessoryId,
        tx
      ),
    ]);
  }
}

export { ConfirmAccessorymanagementService };
