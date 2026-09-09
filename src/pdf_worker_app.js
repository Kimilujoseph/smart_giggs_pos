import dotenv from "dotenv";
dotenv.config();

import { initHybridWorker } from "./workers/hybridWorker.js";

initHybridWorker()
    .then(() => console.log("[PDF Worker] Ready and listening for jobs."))
    .catch((err) => {
        console.error("[PDF Worker] Failed to start:", err.message);
        process.exit(1);
    });
