import express from "express";
import verifyUser from "../../middleware/verification.js";
import {
  addNewAccessoryProduct,
  createNewProductUpdate,
  confirmAccessoryArrival,
  findAllAccessoryProduct,
  findSpecificAccessoryProduct,
  createNewSoftDeletion,
  findSpecificProductTransferHistory,
  findSpecificProductHistory,
} from "../controllers/accessory-management-controller.js";
import { Authorization } from "../../middleware/Authorization.js";

const router = express.Router();

router.post("/add-accessory-stock", verifyUser, addNewAccessoryProduct);
router.get("/accessory", verifyUser, findAllAccessoryProduct);
router.get("/profile/accessory/:id", verifyUser, findSpecificAccessoryProduct);
router.get("/accessory/item/history/:id", findSpecificProductHistory);
router.get(
  "/accessory/item/transferhistory/:id",
  findSpecificProductTransferHistory
);
router.delete(
  "/create-accessory-deletion/:id",
  verifyUser,
  createNewSoftDeletion
);
router.post("/confirm/accessory/", verifyUser, confirmAccessoryArrival);
router.put("/update-accessory-product/:id", verifyUser, Authorization, createNewProductUpdate);

export default router;
