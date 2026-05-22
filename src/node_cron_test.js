import { calculateAndStoreKPIs } from "../scripts/calculate-kpis.js";
import { cleanupZeroQuantityItems } from "../scripts/deleteZeroQuantityRow.js";

async function test() {
  console.log("Manually running KPI job...");
  const yesterday = new Date(Date.now() - 86400000);
  await calculateAndStoreKPIs(yesterday);

  console.log("\nManually running cleanup job...");
  await cleanupZeroQuantityItems();

  console.log("Test completed.");
}

test().catch(console.error);
