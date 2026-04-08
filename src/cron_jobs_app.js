import cron from "node-cron";
import { calculateAndStoreKPIs } from "../scripts/calculate-kpis";
import { cleanupZeroQuantityItems } from "../scripts/deleteZeroQuantityRow";

cron.schedule(
  "0 1 * * *",
  async () => {
    try {
      const yesterday = new Date(Date.now() - 86400000);
      await calculateAndStoreKPIs(yesterday);
    } catch (err) {
      console.log("KPI calculation  failed");
    }
  },
  { timezone: "Africa/Nairobi" }
);

cron.schedule(
  "0 */4 * * *",
  async () => {
    try {
      console.log("[Cleanup] Starting...");
      await cleanupZeroQuantityItems();
    } catch (err) {
      console.log("cleanup failed");
    }
  },
  { timezone: "Africa/Nairobi" }
);

console.log("Cron worker started. Jobs scheduled.");
