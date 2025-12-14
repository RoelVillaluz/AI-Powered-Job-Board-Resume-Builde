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
    constructor(message) {
        super(message, 400)
        this.name = 'ValidationError';
        this.details = details;
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

    // ✅ Better logging
    if (err.isOperational) {
        console.log(`⚠️  Operational Error [${err.statusCode}]:`, err.message);
    } else {
        console.error('💥 CRITICAL ERROR:', err);
    }

    // Development vs Production
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err.name, // ✅ Add error name
            message: err.message,
            ...(err.details && { details: err.details }), // ✅ Include validation details if present
            stack: err.stack,
            timestamp: err.timestamp
        });
    }

    // Production - don't leak error details
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            ...(err.details && { details: err.details }), // ✅ Include validation details
            timestamp: err.timestamp
        });
    }

    // Programming or unknown error - don't leak details
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong. Please try again later.',
        timestamp: new Date().toISOString()
    });
};