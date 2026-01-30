import logger from "../utils/logger.js";

export class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message)
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400)
        this.name = 'ValidationError';
        this.details = details;
    }
}

export class BadRequestError extends Error {
    constructor(message) {
        super(message, 400)
        this.name = 'BadRequestError'
    }
}

export class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401)
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // ✅ Log error with Winston
    if (err.isOperational) {
        // Operational errors (expected)
        logger.warn('⚠️  Operational Error', {
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?._id || req.user?.id
        });
    } else {
        // Programming errors (unexpected)
        logger.error('💥 CRITICAL ERROR', {
            error: err.name,
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?._id || req.user?.id
        });
    }

    // Development vs Production
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err.name,
            formattedMessage: err.message,  // ← CHANGED from 'message' to 'formattedMessage'
            ...(err.details && { details: err.details }),
            stack: err.stack,
            timestamp: err.timestamp
        });
    }

    // Production - don't leak error details
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            formattedMessage: err.message,  // ← CHANGED from 'message' to 'formattedMessage'
            ...(err.details && { details: err.details }),
            timestamp: err.timestamp
        });
    }

    // Programming or unknown error - don't leak details
    return res.status(500).json({
        success: false,
        status: 'error',
        formattedMessage: 'Something went wrong. Please try again later.',  // ← CHANGED
        timestamp: new Date().toISOString()
    });
};