import { Queue } from 'bullmq';
import IORedis from 'ioredis'
import dotEnv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Resolve .env relative to this file so it always loads correctly
// regardless of cwd when running as a standalone script.
const __dirname = dirname(fileURLToPath(import.meta.url))
dotEnv.config({ path: resolve(__dirname, '../../.env') })

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,

    // Force IPv4 — on some systems 'localhost' resolves to ::1 (IPv6)
    // which causes ECONNREFUSED if Redis only binds to 127.0.0.1.
    family: 4,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
})
const reportQueue = new Queue('report-generation', {
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