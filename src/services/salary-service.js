import { SalaryRepository } from '../databases/repository/salary-repository.js';
import { usermanagemenRepository } from '../databases/repository/usermanagement-controller-repository.js';
import { APIError, STATUS_CODE } from '../Utils/app-error.js';

class SalaryService {
  constructor() {
    this.repository = new SalaryRepository();
    this.userRepository = new usermanagemenRepository();
  }

  async createSalaryPayment(paymentData) {
    const { employeeId, processedById } = paymentData;
    const updatedPaymentDate = { ...paymentData, status: "PAID" };
    // 1. Verify users exist
    const [employee, processor] = await Promise.all([
      this.userRepository.findUserById({ id: employeeId }),
      this.userRepository.findUserById({ id: processedById }),
    ]);

    if (!employee) {
      throw new APIError('Not Found', STATUS_CODE.NOT_FOUND, 'Employee not found.');
    }
    if (!processor) {
      throw new APIError('Not Found', STATUS_CODE.NOT_FOUND, 'Processing user not found.');
    }


    // if (employee.baseSalary && amount > employee.baseSalary) {
    //   throw new APIError('Bad Request', STATUS_CODE.BAD_REQUEST, 'Salary amount exceeds base salary.');
    // }

    // 3. Create the salary payment
    return this.repository.createSalaryPayment(updatedPaymentDate);
  }

  async getSalaryPayments(options) {
    try {
      return await this.repository.findSalaryPayments(options);
    } catch (err) {
      throw new APIError(
        'Service Error',
        STATUS_CODE.INTERNAL_ERROR,
        'Failed to get salary payments'
      );
    }
  }

  async voidSalaryPayment(paymentId) {
    try {
      const payment = await prisma.salaryPayment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        throw new APIError('Not Found', STATUS_CODE.NOT_FOUND, 'Salary payment not found.');
      }
      if (payment.status === 'VOIDED') {
        throw new APIError('Bad Request', STATUS_CODE.BAD_REQUEST, 'This payment has already been voided.');
      }
      return await this.repository.voidSalaryPayment(paymentId);
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      throw new APIError(
        'Service Error',
        STATUS_CODE.INTERNAL_ERROR,
        'Failed to void salary payment'
      );
    }
  }
}

export { SalaryService };
