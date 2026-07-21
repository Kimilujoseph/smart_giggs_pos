import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// How long a single worker thread is allowed to run before it is killed (ms).
const WORKER_TIMEOUT_MS = 90_000;

class WorkerThreadPool {
    constructor(maxWorkers) {
        this.maxWorkers = maxWorkers;
        this.activeWorkers = 0;
        this.queue = [];
    }

    run(jobParams, wsEndpoint) {
        return new Promise((resolve, reject) => {
            if (this.activeWorkers >= this.maxWorkers) {
                // Queue the work item; it will be picked up by next() once a
                // slot frees up.  This is the only place a caller can wait.
                console.log(
                    `[ThreadPool] All ${this.maxWorkers} slots busy — queuing job. ` +
                    `Queue depth: ${this.queue.length + 1}`
                );
                this.queue.push({ jobParams, wsEndpoint, resolve, reject });
            } else {
                this.execute(jobParams, wsEndpoint, resolve, reject);
            }
        });
    }

    execute(jobParams, wsEndpoint, resolve, reject) {
        this.activeWorkers++;
        console.log(
            `[ThreadPool] Spawning worker ` +
            `(active: ${this.activeWorkers}/${this.maxWorkers}, queued: ${this.queue.length})`
        );

        const workerPath = path.resolve(__dirname, "reportWorkerThread.js");
        const worker = new Worker(workerPath, {
            workerData: { jobParams, wsEndpoint },
        });

        // Whether resolve/reject has already been called for this slot
        let settled = false;

        const settle = (fn, value) => {
            if (settled) return;
            settled = true;
            fn(value);
        };

        // Force-kill the worker if it takes longer than WORKER_TIMEOUT_MS.
        // This is the ONLY legitimate place to call worker.terminate().
        const timeoutId = setTimeout(() => {
            console.warn(`[ThreadPool] Worker timed out after ${WORKER_TIMEOUT_MS / 1000}s — force terminating.`);
            worker.terminate().catch(console.error);
            settle(reject, new Error(`[ThreadPool] Worker timed out after ${WORKER_TIMEOUT_MS / 1000}s`));
        }, WORKER_TIMEOUT_MS);

        worker.on("message", (message) => {
            if (message.type === "PROGRESS") {
                // Optional: relay progress to caller if needed
            } else if (message.type === "COMPLETE") {
                clearTimeout(timeoutId);
                settle(resolve, Buffer.from(message.buffer));

            } else if (message.type === "error") {
                clearTimeout(timeoutId);
                settle(reject, new Error(message.error));
            } else if (message.type === "MEMORY_WARNING") {
                console.warn("[ThreadPool] Worker memory warning:", message.usage);
            }
        });

        worker.on("error", (err) => {
            clearTimeout(timeoutId);
            settle(reject, err);
        });

        worker.on("exit", (code) => {
            clearTimeout(timeoutId);
            this.activeWorkers--;
            console.log(
                `[ThreadPool] Worker exited (code: ${code}). ` +
                `Active: ${this.activeWorkers}/${this.maxWorkers}, Queued: ${this.queue.length}`
            );

            // If the worker crashed without sending COMPLETE or error
            if (code !== 0) {
                settle(reject, new Error(`[ThreadPool] Worker crashed with exit code ${code}`));
            }

            // Always try to drain the queue after a slot frees up
            this._next();
        });
    }

    _next() {
        if (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
            const { jobParams, wsEndpoint, resolve, reject } = this.queue.shift();
            console.log(
                `[ThreadPool] Dequeuing waiting job. ` +
                `Queue depth now: ${this.queue.length}`
            );
            this.execute(jobParams, wsEndpoint, resolve, reject);
        }
    }
}

export default WorkerThreadPool;
