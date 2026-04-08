import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteZeroQuantityRows(model, modelName) {
  let totalDeleted = 0;
  const BATCH_SIZE = 1000;

  try {
    while (true) {
      const records = await model.findMany({
        where: { quantity: 0 },
        select: { id: true },
        take: BATCH_SIZE,
      });

      if (records.length === 0) break;

      const ids = records.map((r) => r._id);
      const results = await model.deleteMany({
        where: { id: { in: ids } },
      });

      totalDeleted += results.count;
      console.log(
        `[${modelName}] Deleted batch of ${result.count} rows (total so far: ${totalDeleted})`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log(
      `[${modelName}] Cleanup finished. Total deleted: ${totalDeleted}`
    );
  } catch (error) {
    throw error;
  }
}

const cleanupZeroQuantityItems = async () => {
  console.log(`[CRON] Starting cleanup job at ${new Date().toISOString()}`);
  try {
    // Run deletions for both tables (order doesn't matter, no foreign key dependencies between them)
    await deleteZeroQuantityRows(prisma.mobileItems, "mobileItems");
    await deleteZeroQuantityRows(prisma.accessoryItems, "accessoryItems");
    console.log(
      `[CRON] Cleanup job finished successfully at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("[CRON] Cleanup job failed:", error);
    // Optionally send alert to monitoring system
  }
};

export { cleanupZeroQuantityItems };
