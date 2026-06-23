import express from "express";
import { handleGetPayments } from "../controllers/payment-controller.js";
import verifyUser from "../../middleware/verification.js";
import { Authorization } from "../../middleware/Authorization.js";
import { parseSalesQuery } from "../../middleware/query-parser.js";

const router = express.Router();

// All routes in this file are authenticated
router.use(verifyUser);

router.get("/", Authorization, parseSalesQuery, handleGetPayments);

export default router;
