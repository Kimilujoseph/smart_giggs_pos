import dotenv from "dotenv";
dotenv.config();

import { initHybridWorker } from "./workers/hybridWorker.js";

// Dedicated PDF generation process.
// Owns the BrowserPool and BullMQ consumer — no API routes, no cluster instances.
// Enqueued by any API instance via salesReportQueue; processed here exclusively.
initHybridWorker()
    .then(() => console.log("[PDF Worker] Ready and listening for jobs."))
    .catch((err) => {
        console.error("[PDF Worker] Failed to start:", err.message);
        process.exit(1);
    });
