// Api/controllers/inventory-management-controller.js
import { MobilemanagementService } from "../../services/mobile-controller-service.js";
import { APIError, STATUS_CODE } from "../../Utils/app-error.js";
import moment from "moment";

const inventoryManagementSystem = new MobilemanagementService();

const addNewPhoneProduct = async (req, res, next) => {
  try {
    const user = req.user;
    console.log("User in addNewPhoneProduct:", user);
    const { phoneDetails } = req.body;
    const { supplierId, paymentStatus } = phoneDetails;
    let availableStock = 1;
    const newPhoneStock = await inventoryManagementSystem.createnewPhoneproduct(
      {
        phoneDetails,
        user: user.id,
        supplierId,
        paymentStatus,
      }
    );
    res.status(201).json({
      message: "product successfully added",
      data: newPhoneStock,
      error: false,
    });
  } catch (err) {
    next(err);
  }
};

const findSpecificMobileProduct = async (req, res, next) => {
  try {
    const productID = req.params.id;
    const id = parseInt(productID, 10);
    const user = req.user;
    const foundproduct =
      await inventoryManagementSystem.findSpecificMobileProduct(id);
    return res.status(200).json({ status: 200, data: foundproduct });
  } catch (err) {
    next(err);
  }
};

const findSpecificProductHistory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const productHistory = await inventoryManagementSystem.getproductHistory({
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
        .status(500)
        .json({ message: "Internal Server Error", error: false });
    }
  }
};

const findSpecificProductTransferHistory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const productTransferHistory =
      await inventoryManagementSystem.getproductTransferHistory({ id });
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
        .status(500)
        .json({ message: "Internal Server Error", error: false });
    }
  }
};

const findAllMobileAccessoryProduct = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { filterdItem, totalItems } =
      await inventoryManagementSystem.findAllMobileAccessory(page, limit);
    res.status(200).json({
      message: "all mobile accessories",
      data: filterdItem,
      totalItems,
      page,
    });
  } catch (err) {
    next(err);
  }
};

const createnewproductupdate = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.id;
    const id = req.params.id;
    const updates = req.body;


    // Call the service method to update the phone stock
    const updatedPhone = await inventoryManagementSystem.updatePhoneStock(
      id,
      updates,
      userId
    );

    return res.status(200).json({
      status: 200,
      data: updatedPhone,
      message: "Phone stock updated successfully",
    });
  } catch (err) {
    console.log("errored", err)
    next(err);
  }
};

const confirmphonearrival = async (req, res, next) => {
  try {
    let userId;
    const { shopname, productId, transferId, quantity } = req.body;
    const user = req.user;

    const stockId = parseInt(productId, 10);
    const transferID = parseInt(transferId, 10);
    userId = parseInt(user.id, 10);

    const updateproductTransfer =
      await inventoryManagementSystem.confirmDistribution({
        userId,
        shopname,
        stockId,
        quantity,
        transferID,
      });


    return res.status(200).json({
      messsage: "successfully confirmed arrival",
      status: 200,
      error: false,
    });
  } catch (err) {
    console.log(err);
    if (err instanceof APIError) {
      return res
        .status(err.statusCode)
        .json({ message: err.message, error: true });
    } else {
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: true });
    }
  }
};

const createanewsoftdeleteoftheproduct = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.role !== "superuser" && user.role !== "manager") {
      throw new APIError(
        "unauthorized",
        STATUS_CODE.UNAUTHORIZED,
        "not allowed to update the product"
      );
    }

    const phoneId = req.params.id;

    await inventoryManagementSystem.createAnewSoftDeletion(phoneId);

    return res.status(200).json({
      status: 200,
      data: "successfully deleted the prooduct",
    });
  } catch (err) {
    if (err instanceof APIError) {
      return res.status(err.statusCode).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
};
export {
  addNewPhoneProduct,
  createnewproductupdate,
  confirmphonearrival,
  findAllMobileAccessoryProduct,
  findSpecificMobileProduct,
  createanewsoftdeleteoftheproduct,
  findSpecificProductTransferHistory,
  findSpecificProductHistory,
};
