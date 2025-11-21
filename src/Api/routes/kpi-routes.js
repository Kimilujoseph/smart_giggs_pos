import express from 'express';
import { getSellerPerformance } from '../controllers/kpi-controller.js';
import { parseSalesQuery } from '../../middleware/query-parser.js';
import verifyUser from '../../middleware/verification.js';
const router = express.Router();

// Defines the route for getting seller performance KPIs
// It now uses the parseSalesQuery middleware to handle date and pagination
router.get('/seller-performance', parseSalesQuery, verifyUser, getSellerPerformance);

export default router;
