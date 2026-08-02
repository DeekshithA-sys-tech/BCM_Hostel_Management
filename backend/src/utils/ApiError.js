class ApiError extends Error {
    constructor(statusCode, message, errors = [], stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
        this.timestamp = new Date().toISOString();

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static badRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }

    static validation(message = 'Validation failed', errors = []) {
        return new ApiError(422, message, errors);
    }

    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Access denied') {
        return new ApiError(403, message);
    }

    static notFound(resource = 'Resource') {
        return new ApiError(404, `${resource} not found`);
    }

    static conflict(message) {
        return new ApiError(409, message);
    }

    static internal(message = 'Internal server error') {
        return new ApiError(500, message);
    }

    // Alias for validate middleware compatibility
    static validation(message = 'Validation failed', errors = []) {
        return new ApiError(422, message, errors);
    }
}

module.exports = ApiError;
