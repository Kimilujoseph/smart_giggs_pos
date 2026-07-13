import express from "express";
import verifyUser from "../../middleware/verification.js";
import {
  addNewPhoneProduct,
  findAllMobileAccessoryProduct,
  findSpecificMobileProduct,
  createanewsoftdeleteoftheproduct,
  createnewproductupdate,
  findSpecificProductTransferHistory,
  findSpecificProductHistory,
  confirmphonearrival,
} from "../controllers/mobile-management-controller.js";
import { validateSalesPayload } from "../../Utils/joivalidation.js";
import { Authorization } from "../../middleware/Authorization.js";
const route = express.Router();
route.get("/mobile", verifyUser, findAllMobileAccessoryProduct);
route.get("/profile/mobile/:id", verifyUser, findSpecificMobileProduct);
route.get("/mobile/item/history/:id", findSpecificProductHistory);
route.get(
  "/mobile/item/transferhistory/:id",
  findSpecificProductTransferHistory
);
route.post("/add-phone-stock", verifyUser, Authorization, addNewPhoneProduct);

route.delete(
  "/create-phone-deletion/:id",
  verifyUser,
  createanewsoftdeleteoftheproduct
);
route.post("/confirm/phone/", verifyUser, confirmphonearrival);
//route.put("/update-phone-stock", verifyUser, updatePhoneStock);
route.put("/update-phone-product/:id", verifyUser, createnewproductupdate);
export default route;
