import { Worker } from "bullmq";
import BrowserPool from "../Utils/BrowserPool.js";
import WorkerThreadPool from "./threadPool.js";
import { redisConnection } from "../queues/salesReportQueue.js";

const maxThreads = parseInt(process.env.MAX_THREADS || "4", 10);
const threadPool = new WorkerThreadPool(maxThreads);

async function initHybridWorker() {
    await BrowserPool.intialize();
    
    const worker = new Worker("report-generation", async (job) => {
        let wsEndpoint;
        try {
            wsEndpoint = await BrowserPool.getWSEndpoint();
            const pdfBuffer = await threadPool.run(job.data, wsEndpoint);
            await job.updateProgress(100);
            return pdfBuffer;
        } catch (e) {
            console.error(`Job ${job.id} failed: ${e}`);
            throw e;
        } finally {
            if (wsEndpoint) {
                await BrowserPool.releaseWSEndpoint(wsEndpoint);
            }
        }
    }, {
        connection: redisConnection
    });

    console.log("Hybrid Report Worker Initialized.");
    return worker;
}

export { initHybridWorker };