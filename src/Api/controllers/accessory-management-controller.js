import { AccessoryManagementService } from "../../services/accessory-controller-service.js";
import { ConfirmAccessorymanagementService } from "../../services/confirmAccessories_service.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";

const accessoryManagementService = new AccessoryManagementService();
const confirmAccessoryArrivalManagement = new ConfirmAccessorymanagementService()

const addNewAccessoryProduct = async (req, res, next) => {
  try {
    const user = req.user;

    const accessoryDetails = req.body;
    await accessoryManagementService.createNewAccessoryProduct(
      {
        accessoryDetails,
        user: user.id,
      }
    );
    res.status(201).json({
      message: "Accessory successfully added",

      error: false,
    });
  } catch (err) {
    next(err)
  }
};

const findSpecificAccessoryProduct = async (req, res, next) => {
  try {
    const productID = req.params.id;
    const id = parseInt(productID, 10);
    const user = req.user;

    const foundProduct =
      await accessoryManagementService.findSpecificAccessoryProduct(id);
    return res.status(200).json({ status: 200, data: foundProduct });
  } catch (err) {
    next(err)
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
    next(err)
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
    next(err)
  }
};

const findAllAccessoryProduct = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user;

    const { filteredItem, totalItems } =
      await accessoryManagementService.findAllAccessoryProduct(page, limit);
    res.status(200).json({
      message: "All mobile accessories",
      data: filteredItem,
      totalItems,
      page,
    });
  } catch (err) {
    next(err)
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
    // const user = req.user;
    const accessoryId = req.params.id;

    await accessoryManagementService.createNewSoftDeletion(accessoryId);

    return res.status(200).json({
      status: 200,
      data: "Successfully deleted the product",
    });
  } catch (err) {
    next(err)
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