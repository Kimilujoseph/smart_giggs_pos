import { PrismaClient } from "@prisma/client";
import { InternalServerError } from "../../Utils/app-error.js";
const prisma = new PrismaClient();

class CustomerRepository {
  async createCustomer(customerData) {
    try {
      return await prisma.customer.create({
        data: customerData,
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async findCustomerById(customerId) {
    try {
      return await prisma.customer.findUnique({
        where: { id: parseInt(customerId) },
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }

  async findCustomerByPhone(phone) {
    try {
      return await prisma.customer.findFirst({
        where: { phoneNumber: phone },
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }
  async findCustomerByEmail(email) {
    try {
      return await prisma.customer.findFirst({
        where: { email: email },
      });
    } catch (err) {
      throw new InternalServerError();
    }
  }
}

export default new CustomerRepository();
