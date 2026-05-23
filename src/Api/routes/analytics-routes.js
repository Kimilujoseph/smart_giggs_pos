import express from 'express';
import { getTopProducts, getShopPerformanceSummary, getSalesByStatus } from '../controllers/analytics-controller.js';
import verifyUser from '../../middleware/verification.js';
import { Authorization } from '../../middleware/Authorization.js';
const router = express.Router();

router.get('/top-products', verifyUser, Authorization, getTopProducts);
router.get('/shop-performance-summary', verifyUser, Authorization, getShopPerformanceSummary);
router.get('/sales-by-status', verifyUser, Authorization, getSalesByStatus);

export default router;
