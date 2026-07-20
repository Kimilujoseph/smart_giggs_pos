import Worker from 'bullmq'
import BrowserPool from '../Utils/BrowserPool'
import WorkerThreadPool from './threadPool'

const maxThreads = parseInt(process.env.MAX_THREADS || 4, 10)
const threadPool = new WorkerThreadPool(maxThreads)

async function initHybridWorker() {
    await BrowserPool.intialize();
    const worker = new Worker('report-generation', async (job) => {
        let wsEndpoint;
        try {
            wsEndpoint = await BrowserPool.getWSEndpoint();
            const pdfBuffer = await threadPool.run(job.data, wsEndpoint);
            job.updateProgress(100);
            return pdfBuffer;
        } catch (e) {
            console.erroe(`Job ${job.id} failed : ${e}`);
            throw e;
        } finally {
            if (wsEndpoint) {
                BrowserPool.releaseWSEndpoint(wsEndpoint)
            }
        }
    })

}