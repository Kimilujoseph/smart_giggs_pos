import express from "express";
import verifyUser from "../../middleware/verification.js";
import { generalAuthorization, Authorization } from "../../middleware/Authorization.js";
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


const router = express.Router();

router.post("/add-accessory-stock", verifyUser, Authorization, addNewAccessoryProduct);
router.get("/accessory", verifyUser, Authorization, findAllAccessoryProduct);
router.get("/profile/accessory/:id", verifyUser, Authorization, findSpecificAccessoryProduct);
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
