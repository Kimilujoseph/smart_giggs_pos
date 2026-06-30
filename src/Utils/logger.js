import winston from "winston";
import dotEnv from "dotenv";
dotEnv.config();

const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, service, stack, ...metaData }) => {
        let metaString = '';
        if (Object.keys(metaData).length > 0) {
            metaString = '' + JSON.stringify(metaData)
        }
        if (stack) {
            return `${timestamp} [${service}] ${level}: ${message}${metaString}\n${stack}`;
        }
        return `${timestamp} [${service}] ${level}: ${message}${metaString}`;
    })
)

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, service, stack, ...metaData }) => {
        let metaString = '';
        if (Object.keys(metaData).length > 0) {
            metaString = '' + JSON.stringify(metaData)
        }
        if (stack) {
            return `${timestamp} [${service}] ${level}: ${message}${metaString}\n${stack}`;
        }
        return `${timestamp} [${service}] ${level}: ${message}${metaString}`;
    })
)

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    defaultMeta: { service: process.env.SERVICE_NAME || "user-service" },
    format: process.env.NODE_ENV === "development" ? devFormat : prodFormat,
    transports: [new winston.transports.Console(),]
})

export default logger;