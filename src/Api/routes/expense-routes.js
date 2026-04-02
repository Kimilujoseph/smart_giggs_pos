import express from 'express';
import { handleCreateExpense, handleGetExpenses } from '../controllers/expense-controller.js';
import verifyUser from '../../middleware/verification.js';
import { parseDateQuery } from '../../middleware/query-parser.js';

const router = express.Router();

router.post('/create', verifyUser, handleCreateExpense);
router.get('/', verifyUser, parseDateQuery, handleGetExpenses);

export default router;
