import { Worker } from "worker_threads"
import path from 'path'
//import { worker } from "cluster";

class WorkerThreadPool {
    constructor(maxWorkers) {
        this.maxWorkers = maxWorkers
        this.workers = 0;
        this.queue = [];
    }

    run(jobParams, wsEndpoint) {
        return new Promise((resolve, reject) => {
            if (this.activeWorkers >= this.maxWorkers) {
                this.queue.push({ jobParams, wsEndpoint, resolve, reject });
                return;
            }

        })
    }

    execute(jobParams, wsEndpoint, resolve, reject) {
        this.activeWorkers++;
        const workerPath = path.resolve(__dirname, 'reportWorkerThread.js');
        const worker = new Worker(workerPath, {
            workerData: { jobParams, wsEndpoint }
        })
        let onProgressCallback = null;
        worker.onProgressCallback = (cb) => {
            onProgressCallback = cb
        }
        worker.on('message', (message) => {
            if (message.type === 'PROGRESS' && onProgressCallback) {
                onProgressCallback(message.progress)
            }
            else if (message.type === 'COMPLETE') {
                resolve(Buffer.from(message.buffer))
            } else if (message.type === 'error') {
                reject(new Error(message.error))
            }
        })
        worker.on('error', reject)
        worker.on('exit', (code) => {
            this.activeWorkers--;
            if (code !== 0) {
                reject(new Error(`Worker exited with code ${code}`))
            }
            this.next();
        })
        return worker;
    }
    next() {
        if (this.queue.length > 0) {
            const {
                jobParams,
                wsEndpoint,
                resolve,
                reject
            } = this.queue.shift();
            this.execute(jobParams, wsEndpoint, resolve, reject);
        }
    }

}

export default WorkerThreadPool;

