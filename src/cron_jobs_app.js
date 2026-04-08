import cron from "node-cron";
import { calculateAndStoreKPIs } from "../scripts/calculate-kpis";
import { cleanupZeroQuantityItems } from "../scripts/deleteZeroQuantityRow";

cron.schedule(
  "0 1 * * *",
  async () => {
    console.log("[KPI] Starting...");
    await calculateAndStoreKPIs();
  },
  { timezone: "Africa/Nairobi" }
);

cron.schedule(
  "0 */4 * * *",
  async () => {
    console.log("[Cleanup] Starting...");
    await cleanupZeroQuantityItems();
  },
  { timezone: "Africa/Nairobi" }
);

console.log("Cron worker started. Jobs scheduled.");
