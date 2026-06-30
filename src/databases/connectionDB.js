
import { PrismaClient } from "@prisma/client";
import logger from "../Utils/logger.js";
const MAX_RETRIES = 15;
const RETRY_DELAY = 15000; // 5 seconds

let prismaClient;

const connectWithRetry = async () => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      prismaClient = new PrismaClient();
      await prismaClient.$connect();
      logger.info("Database connected successfully.")
      return prismaClient;
    } catch (error) {
      logger.error("Failed to connect to the database. Retry " + (i + 1) + "/" + MAX_RETRIES + "...")
      if (i < MAX_RETRIES - 1) {
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
      } else {
        logger.error("Could not connect to the database. Giving up.");
        process.exit(1);
      }
    }
  }
};

const connectionDB = await connectWithRetry();

export { connectionDB };
