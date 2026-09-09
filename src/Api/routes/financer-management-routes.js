import express from "express";
import { authorizeFinancials,generalAuthorization } from "../../middleware/Authorization.js";
import verifyUser from "../../middleware/verification.js";
import {
  createFinancer,
  getFinancerById,
  getAllFinancers,
  updateFinancer,
  deleteFinancer,
} from "../controllers/financer-management-controller.js";

const router = express.Router();

router.post("/create", verifyUser,authorizeFinancials, createFinancer);
router.get("/get/:id", verifyUser,authorizeFinancials, getFinancerById);
router.get("/all", verifyUser,generalAuthorization, getAllFinancers);
router.put("/financer/:id", verifyUser,authorizeFinancials, updateFinancer);
router.delete("/financer/:id", verifyUser,authorizeFinancials, deleteFinancer);

export default router;
