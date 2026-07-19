import express from "express";
import verifyUser from "../../middleware/verification.js";
import { handleGetSales, handleBulkSale, handleUpdateFinanceStatus, handleSummarySales, handleGenerateReport } from "../controllers/sales-contoller.js";
import { parseSalesQuery } from "../../middleware/query-parser.js";
import { checkRole } from "../../helpers/authorisation.js";

const route = express.Router();

// Consolidated Sales Report Routes
route.get("/report/category/:categoryId", verifyUser, parseSalesQuery, handleGetSales);
route.get("/report/shop/:shopId", verifyUser, parseSalesQuery, handleGetSales);
route.get("/report/user/:userId", verifyUser, parseSalesQuery, handleGetSales);
route.get("/report/financer/:financerId", verifyUser, parseSalesQuery, handleGetSales);
route.get("/report", verifyUser, parseSalesQuery, handleGetSales);
route.get("/report/summary", verifyUser, parseSalesQuery, handleSummarySales);
route.post("/report/generate", verifyUser, parseSalesQuery, handleGenerateReport)

// Make a sale route
route.post("/items/sale", verifyUser, handleBulkSale);

const authorizeFinanceUpdate = (req, res, next) => {
  if (!checkRole(req.user.role, ["manager", "superuser"])) {
    return res.status(403).json({ message: "You are not authorized to update sales." });
  }
  next();
};

// Update finance status route
route.patch("/:saleType/:saleId/finance-status", verifyUser, authorizeFinanceUpdate, handleUpdateFinanceStatus);

export default route;
