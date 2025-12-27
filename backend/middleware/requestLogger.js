import morgan from 'morgan';
import logger from '../utils/logger.js';

/**
 * Morgan token for colored status codes
 */
morgan.token('status-colored', (req, res) => {
    const status = req.statusCode;
    const color = status >= 500 ? '31' // red
                : status >= 400 ? '33' // yellow
                : status >= 300 ? '36' // cyan
                : status >= 200 ? '32' // green
                : '0' // default
    return `\x1b[${color}m${status}\x1b[0m`;
})

/**
 * Custom format for development
 */
const devFormat = ':method :url :status-colored :response-time ms - :res[content-length]';

/**
 * Production format (includes more details)
 */
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

/**
 * Create Morgan middleware
 */
export const requestLogger = morgan(
    process.envction.NODE_ENV === 'production' ? prodFormat : devFormat,
    {
        stream: logger.stream,
        skip: (req, res) => {
            // Skip logging health check endpoints
            return req.url === '/health' || req.url === '/api/health';
        }
    }
);