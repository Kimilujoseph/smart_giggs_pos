import paymentRepository from '../databases/repository/payment-repository.js';
import { APIError, STATUS_CODE } from "../Utils/app-error.js"
const paymentRepo = new paymentRepository()
class PaymentService {

  async getPayments(filters) {
    const { summary, ...rest } = await paymentRepo.findPayments(filters);

    const formattedSummary = summary.reduce((acc, group) => {
      acc[group.paymentMethod] = {
        totalAmount: group._sum.amount,
        count: group._count._all,
      };
      return acc;
    }, {});

    return { summary: formattedSummary, ...rest };
  }
}

export default PaymentService;

