import { PrismaClient } from '@prisma/client';

/**
 * @type {PrismaClient}
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    transactionOptions: {
      timeout: 20000,
    },
  });
} else {

  if (!global.prisma) {
    global.prisma = new PrismaClient({
      transactionOptions: {
        timeout: 50000,
      },
    });
  }
  prisma = global.prisma;
}

export default prisma;
