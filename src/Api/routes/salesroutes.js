import express from "express";
import verifyUser from "../../middleware/verification.js";
import { handleGetSales, handleBulkSale, handleUpdateFinanceStatus, handleSummarySales, handleGenerateReport, handleGetReportStatus } from "../controllers/sales-contoller.js";
import { parseSalesQuery } from "../../middleware/query-parser.js";
import { checkRole } from "../../helpers/authorisation.js";
import { authorizeFinancials,Authorization,generalAuthorization } from "../../middleware/Authorization.js";

const route = express.Router();

// Consolidated Sales Report Routes
route.get("/report/category/:categoryId", verifyUser,Authorization, parseSalesQuery, handleGetSales);
route.get("/report/shop/:shopId", verifyUser,Authorization, parseSalesQuery, handleGetSales);
route.get("/report/user/:userId", verifyUser,generalAuthorization, parseSalesQuery, handleGetSales);
route.get("/report/financer/:financerId", verifyUser,Authorization, parseSalesQuery, handleGetSales);
route.get("/report", verifyUser, parseSalesQuery, handleGetSales);
route.get("/report/summary", verifyUser,Authorization, parseSalesQuery, handleSummarySales);
route.post("/report/generate", verifyUser,generalAuthorization, parseSalesQuery, handleGenerateReport);
route.get("/report/status/:jobId", verifyUser,generalAuthorization, handleGetReportStatus);

// Make a sale route
route.post("/items/sale", verifyUser, handleBulkSale);

const authorizeFinanceUpdate = (req, res, next) => {
  const userRole = String(req.user?.role || "").toLowerCase();
  if (!["manager", "superuser"].includes(userRole)) {
    return res.status(403).json({ message: "You are not authorized to update sales." });
  }
  next();
};

// Update finance status route
route.patch("/:saleType/:saleId/finance-status", verifyUser, authorizeFinanceUpdate, handleUpdateFinanceStatus);

export default route;
