import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WorkerThreadPool {
    constructor(maxWorkers) {
        this.maxWorkers = maxWorkers;
        this.activeWorkers = 0;
        this.queue = [];
    }

    run(jobParams, wsEndpoint) {
        return new Promise((resolve, reject) => {
            if (this.activeWorkers >= this.maxWorkers) {
                this.queue.push({ jobParams, wsEndpoint, resolve, reject });
            } else {
                this.execute(jobParams, wsEndpoint, resolve, reject);
            }
        });
    }

    execute(jobParams, wsEndpoint, resolve, reject) {
        this.activeWorkers++;
        const workerPath = path.resolve(__dirname, "reportWorkerThread.js");
        const worker = new Worker(workerPath, {
            workerData: { jobParams, wsEndpoint }
        });
        
        let onProgressCallback = null;
        worker.onProgressCallback = (cb) => {
            onProgressCallback = cb;
        };
        
        let completed = false;

        // Safety timeout to prevent any worker from hanging the pool indefinitely
        const timeoutId = setTimeout(() => {
            if (!completed) {
                completed = true;
                reject(new Error("Worker timed out after 60 seconds"));
                worker.terminate().catch(console.error);
            }
        }, 60000);

        worker.on("message", (message) => {
            if (message.type === "PROGRESS" && onProgressCallback) {
                onProgressCallback(message.progress);
            } else if (message.type === "COMPLETE") {
                completed = true;
                clearTimeout(timeoutId);
                resolve(Buffer.from(message.buffer));
                worker.terminate().catch(console.error);
            } else if (message.type === "error") {
                completed = true;
                clearTimeout(timeoutId);
                reject(new Error(message.error));
                worker.terminate().catch(console.error);
            }
        });
        
        worker.on("error", (err) => {
            if (!completed) {
                completed = true;
                clearTimeout(timeoutId);
                reject(err);
            }
        });
        
        worker.on("exit", (code) => {
            this.activeWorkers--;
            clearTimeout(timeoutId);
            if (code !== 0 && !completed) {
                completed = true;
                reject(new Error(`Worker exited with code ${code}`));
            }
            this.next();
        });
        
        return worker;
    }

    next() {
        if (this.queue.length > 0) {
            const { jobParams, wsEndpoint, resolve, reject } = this.queue.shift();
            this.execute(jobParams, wsEndpoint, resolve, reject);
        }
    }
}

export default WorkerThreadPool;
