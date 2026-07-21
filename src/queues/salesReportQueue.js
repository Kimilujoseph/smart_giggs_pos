import { Queue } from 'bullmq';
import IORedis from 'ioredis'

const redisConnection = new IORedis({
    //use cloud link to connect
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
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
        removeOnComplete: true,
        removeOnFail: true
    }
})


export { redisConnection };
export default reportQueue;