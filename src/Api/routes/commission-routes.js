import express from 'express';
import verifyUser from '../../middleware/verification.js';
import { handleCreateCommissionPayment, handleGetCommissionPayments, handleVoidCommissionPayment } from '../controllers/commission-controller.js';
import { paymentAuthorization } from '../../middleware/Authorization.js';
import { parseDateQuery } from '../../middleware/query-parser.js';

const route = express.Router();

route.post('/pay', verifyUser,paymentAuthorization, handleCreateCommissionPayment);
route.get('/', verifyUser, parseDateQuery, handleGetCommissionPayments);
route.post('/pay/:id/void', verifyUser,paymentAuthorization, handleVoidCommissionPayment);

export default route;
