const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert known Mongoose/JWT errors to ApiError
    if (err.name === 'CastError') {
        error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        const value = err.keyValue?.[field];
        error = ApiError.conflict(`Duplicate value: ${field} '${value}' already exists`);
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message
        }));
        error = ApiError.badRequest('Validation failed', errors);
    }

    if (err.name === 'JsonWebTokenError') {
        error = ApiError.unauthorized('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Token expired');
    }

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = ApiError.badRequest(`File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 5}MB`);
        } else {
            error = ApiError.badRequest(err.message);
        }
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.path} - ${statusCode}: ${message}`, { stack: err.stack });
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: error.errors || [],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
