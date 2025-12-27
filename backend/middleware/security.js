import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import cors from 'cors';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, try again later.',
    standardHeaders: true,
    legacyHeaders: false,
})

// Stricter rate limit for specific endpoints
export const createMessageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 15,
    message: 'Too many messages, please slow down'
})

// CORS configuration
export const corsOptions = {
    origin: process.env.dev.CLIENT_URL || 'localhost:5173',
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