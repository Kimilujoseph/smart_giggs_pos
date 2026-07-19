import { parentPort, workerData } from "worker_threads";
import puppeteer from "puppeteer";

async function processReport() {
    const { jobParams, wsEndpoint } = workerData;
    let browser, page;

    const memoryMonitor = setInterval(() => {
        try {
            const usage = process.memoryUsage();
            if (usage.heapUsed > 1.5 * 1024 * 1024 * 1024) {
                parentPort.postMessage({ type: "MEMORY_WARNING", usage });
            }
        } catch (error) {
            console.error("Memory Monitor Error", error);
        }
    }, 5000)


}
