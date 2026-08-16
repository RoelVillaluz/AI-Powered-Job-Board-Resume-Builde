import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import cors from 'cors';

const K6_BYPASS_TOKEN = process.env.K6_BYPASS_TOKEN;

const skipForK6 = (req) => {
    if (!K6_BYPASS_TOKEN) {
        console.log('[RateLimit] K6_BYPASS_TOKEN not set in env');
        return false;
    }
    const bypass = req.headers['x-k6-bypass'] === K6_BYPASS_TOKEN;
    if (bypass) console.log('[RateLimit] K6 bypass activated');
    return bypass;
};

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipForK6,
})

// Stricter rate limit for specific endpoints
export const createMessageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 15,
    message: 'Too many messages, please slow down',
    keyGenerator: (req) => req.user?.id?.toString() || req.ip,
})

export const insightLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: 'Too many insight requests, please slow down',
    keyGenerator: (req) => req.user?.id?.toString() || req.ip,
    standardHeaders: true,
    legacyHeaders: false,
})

export const embeddingLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: process.env.NODE_ENV !== 'production' ? 15 : 3,
    message: 'Too many requests, please slow down',
    skip: skipForK6
})

// CORS configuration
export const corsOptions = {
    origin: process.env.CLIENT_URL || 'localhost:5173',
    credentials: true,
    optionsSuccessStatus: true
}

// Setup all security middleware
export const setupSecurity = (app) => {
    // Set security HTTP headers
    app.use(helmet());

    // Enable CORS
    app.use(cors(corsOptions));

    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());
    
    // Data sanitization against XSS
    app.use(xss());
    
    // Apply rate limiting
    app.use('/api/', apiLimiter);
}