import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class CustomerRepository {
  async createCustomer(customerData) {
    return await prisma.customer.create({
      data: customerData,
    });
  }

  async findCustomerById(customerId) {
    return await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
    });
  }

  async findCustomerByPhone(phone) {
    return await prisma.customer.findFirst({
      where: { phoneNumber: phone },
    });
  }
  async findCustomerByEmail(email) {
    return await prisma.customer.findFirst({
      where: { email: email },
    });
  }
}

export default new CustomerRepository();
