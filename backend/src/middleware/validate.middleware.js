const ApiError = require('../utils/ApiError');

/**
 * Middleware factory for Joi schema validation.
 * @param {object} schema - Joi schema
 * @param {'body'|'query'|'params'} target - Request part to validate
 */
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errors = error.details.map((d) => ({
                field: d.path.join('.'),
                message: d.message.replace(/['"]/g, '')
            }));
            return next(ApiError.badRequest('Validation failed', errors));
        }

        req[target] = value; // Use sanitized/converted value
        next();
    };
};

module.exports = { validate };
