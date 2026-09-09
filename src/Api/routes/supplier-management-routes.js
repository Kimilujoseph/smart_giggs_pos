import express from "express";
import verifyUser from "../../middleware/verification.js";
import {
  createSupplier,
  getSupplierById,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplier-management-controller.js";
import { Authorization } from "../../middleware/Authorization.js";
const router = express.Router();

router.post("/create", verifyUser,Authorization, createSupplier);
router.get("/get/:id", verifyUser,Authorization, getSupplierById);
router.get("/all", verifyUser,Authorization, getAllSuppliers);
router.put("/update-profile/:id", verifyUser,Authorization, updateSupplier);
router.delete("/supplier/:id", verifyUser,Authorization, deleteSupplier);

export default router;
