import { Queue } from 'bullmq';
import IORedis from 'ioredis'
import dotEnv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'


const __dirname = dirname(fileURLToPath(import.meta.url))
dotEnv.config({ path: resolve(__dirname, '../../.env') })

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    family: 4,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
})
const reportQueue = new Queue(process.env.SALES_REPORT_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            age: 3600,
            count: 20
        },
        removeOnFail: true
    }
})


export { redisConnection };
export default reportQueue;