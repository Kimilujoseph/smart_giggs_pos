import { Worker } from "bullmq";
import BrowserPool from "../Utils/BrowserPool.js";
import WorkerThreadPool from "./threadPool.js";
import { redisConnection } from "../queues/salesReportQueue.js";

const maxThreads = parseInt(process.env.MAX_THREADS || "4", 10);

// One thread pool shared across all concurrent BullMQ job handlers
const threadPool = new WorkerThreadPool(maxThreads);

async function initHybridWorker() {
    await BrowserPool.intialize();
    const concurrency = maxThreads;

    const worker = new Worker(
        "report-generation",
        async (job) => {
            let wsEndpoint;
            try {
                console.log(`[Worker] Starting job ${job.id}`);
                wsEndpoint = await BrowserPool.getWSEndpoint();

                const pdfBuffer = await threadPool.run(job.data, wsEndpoint);
                await job.updateProgress(100);

                console.log(`[Worker] Completed job ${job.id}`);
                return pdfBuffer;
            } catch (e) {
                console.error(`[Worker] Job ${job.id} failed: ${e.message}`);
                throw e;
            } finally {
                if (wsEndpoint) {
                    await BrowserPool.releaseWSEndpoint(wsEndpoint);
                }
            }
        },
        {
            connection: redisConnection,
            concurrency,

            lockDuration: 120_000,

            stalledInterval: 30000,
            maxStalledCount: 1,
        }
    );

    worker.on("failed", (job, err) => {
        console.error(`[Worker] Job ${job?.id} permanently failed: ${err.message}`);
    });

    worker.on("error", (err) => {
        console.error(`[Worker] BullMQ worker error: ${err.message}`);
    });

    console.log(`Hybrid Report Worker Initialized (concurrency: ${concurrency}).`);
    return worker;
}

export { initHybridWorker };