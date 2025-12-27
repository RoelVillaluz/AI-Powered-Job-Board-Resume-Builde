import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom log format
 * Formats logs as: [timestamp] [level] message
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // // Include stack traces for errors
    winston.format.splat(), // String interpolation
    winston.format.json() // Output as JSON
)

/**
 * Console format (colorized for development)
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss ' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`

        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }

        return msg
    })
)

/**
 * Logger instance
 */
const logger = winston.createLogger({
    level: process.env.dev.LOG_LEVEL || 'info', // debug, info, warn, error
    format: logFormat,
    // defaultMeta: { // add later if i switch to microservices architecture
    //     service: 'job-board-api',
    //     environment: process.env.dev.NODE_ENV || 'development'
    // },
    transports: [
        // Console output (always enabled)
        new winston.transports.Console({
            format: consoleFormat
        }),

        // Error logs - separate file
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d', // Keep logs for 14 days
            maxSize: '20m',  // Max 20MB per file
            zippedArchive: true // Compress old logs
        }),

        // Combined logs - all levels
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            maxSize: '20m',
            zippedArchive: true
        }),

        // HTTP logs (optional)
        new DailyRotateFile({
            filename: path.join(__dirname, '../logs/http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            maxFiles: '7d',
            maxSize: '20m'
        })
    ],

    // Don't exit on handled exceptions
    exitOnError: false
})

/**
 * Create a logs directory if it doesn't exist
 */
import fs from 'fs';
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    logger.info('📁 Created logs directory');
}

/**
 * Stream for Morgan (HTTP request logging)
 */
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

export default logger;