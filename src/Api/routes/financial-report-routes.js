import express from "express";
import verifyUser from "../../middleware/verification.js";
import { handleGetFinancialSummary } from "../controllers/financial-report-controller.js";
import { checkRole } from "../../helpers/authorisation.js";
import { parseDateQuery } from "../../middleware/query-parser.js";
import { authorizeFinancials } from "../../middleware/Authorization.js";

const route = express.Router();



route.get("/report/financial-summary", verifyUser, authorizeFinancials, parseDateQuery, handleGetFinancialSummary);

export default route;
