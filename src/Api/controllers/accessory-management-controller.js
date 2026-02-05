import { AccessoryManagementService } from "../../services/accessory-controller-service.js";
import { ConfirmAccessorymanagementService } from "../../services/confirmAccessories_service.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const accessoryManagementService = new AccessoryManagementService();
const confirmAccessoryArrivalManagement = new ConfirmAccessorymanagementService()

const addNewAccessoryProduct = async (req, res, next) => {
  try {
    const user = req.user;
    if (!["superuser", "manager"].includes(user.role)) {
      throw new APIError(
        "Not authorised",
        STATUS_CODE.UNAUTHORIZED,
        "Not authorised to add new accessory"
      );
    }
    const accessoryDetails = req.body;
    const newAccessoryProduct = await accessoryManagementService.createNewAccessoryProduct(
      {
        accessoryDetails,
        user: user.id,
      }
    );
    res.status(201).json({
      message: "Accessory successfully added",
      data: {
        id: newAccessoryProduct.id,
        batchNumber: newAccessoryProduct.batchNumber,
      },
      error: false,
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res
        .status(err.statusCode)
        .json({ message: err.message, error: true });
    } else {
      return res
        .status(STATUS_CODE.INTERNAL_ERROR)
        .json({ message: "Internal Server Error", error: true });
    }
  }
};

const findSpecificAccessoryProduct = async (req, res, next) => {
  try {
    const productID = req.params.id;
    const id = parseInt(productID, 10);
    const user = req.user;
    if (user.role !== "manager" && user.role !== "superuser") {
      throw new APIError("Not allowed", 403, "Not allowed to view the product");
    }
    const foundProduct =
      await accessoryManagementService.findSpecificAccessoryProduct(id);
    return res.status(200).json({ status: 200, data: foundProduct });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error" });
    }
  }
};

const findSpecificProductHistory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const productHistory = await accessoryManagementService.getProductHistory({
      id,
    });
    return res.status(200).json({ message: productHistory, error: false });
  } catch (err) {
    if (err instanceof APIError) {
      return res
        .status(err.statusCode)
        .json({ message: err.message, error: true });
    } else {
      return res
        .status(STATUS_CODE.INTERNAL_ERROR)
        .json({ message: "Internal Server Error", error: false });
    }
  }
};

const findSpecificProductTransferHistory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const productTransferHistory =
      await accessoryManagementService.getProductTransferHistory({ id });
    return res
      .status(200)
      .json({ message: productTransferHistory, error: false });
  } catch (err) {
    if (err instanceof APIError) {
      return res
        .status(err.statusCode)
        .json({ message: err.message, error: true });
    } else {
      return res
        .status(STATUS_CODE.INTERNAL_ERROR)
        .json({ message: "Internal Server Error", error: false });
    }
  }
};

const findAllAccessoryProduct = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user;
    if (user.role !== "superuser" && user.role !== "manager") {
      throw new APIError(
        "Unauthorized",
        STATUS_CODE.UNAUTHORIZED,
        "Not allowed to distribute the product"
      );
    }
    const { filteredItem, totalItems } =
      await accessoryManagementService.findAllAccessoryProduct(page, limit);
    res.status(200).json({
      message: "All mobile accessories",
      data: filteredItem,
      totalItems,
      page,
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error" });
    }
  }
};

const createNewProductUpdate = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.id;
    const id = req.params.id;
    const updates = req.body;


    const updatedAccessory = await accessoryManagementService.updateAccessoryStock(
      id,
      updates,
      userId
    );

    return res.status(200).json({
      status: 200,
      data: updatedAccessory,
      message: "Accessory stock updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

const confirmAccessoryArrival = async (req, res, next) => {
  try {
    let userId;
    const { id, shopname, productId, transferId, quantity } = req.body;
    const user = req.user;
    userId = parseInt(user.id, 10);
    await confirmAccessoryArrivalManagement.confirmDistribution({
      id,
      userId,
      shopname,
      productId,
      quantity,
      transferId,
    });

    return res.status(200).json({
      message: "Successfully confirmed arrival",
      status: 200,
      error: false,
    });
  } catch (err) {

    next(err);
  }
};

const createNewSoftDeletion = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role !== "superuser" && user.role !== "manager") {
      throw new APIError(
        "Unauthorized",
        STATUS_CODE.UNAUTHORIZED,
        "Not allowed to update the product"
      );
    }

    const accessoryId = req.params.id;

    await accessoryManagementService.createNewSoftDeletion(accessoryId);

    return res.status(200).json({
      status: 200,
      data: "Successfully deleted the product",
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    else {
      return res.status(STATUS_CODE.INTERNAL_ERROR).json({ message: "Internal Server Error" });
    }
  }
};

export {
  addNewAccessoryProduct,
  createNewProductUpdate,
  confirmAccessoryArrival,
  findAllAccessoryProduct,
  findSpecificAccessoryProduct,
  createNewSoftDeletion,
  findSpecificProductTransferHistory,
  findSpecificProductHistory,
};