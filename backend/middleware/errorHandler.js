export class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message)
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400)
    }
}

export class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401)
    }
}

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Development vs Production
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            error: err,
            message: err.message,
            stack: err.stack
        })
    }

    // Production - don't leak error details
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        })
    }

    // Programming or unknown error - don't leak details
    console.error('💥 ERROR:', err);
    return res.status(500).json({
        success: false,
        message: 'Something went wrong'
    });
}