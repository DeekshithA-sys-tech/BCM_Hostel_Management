const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware factory.
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized());
        }
        if (!roles.includes(req.user.role)) {
            return next(ApiError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`));
        }
        next();
    };
};

module.exports = { authorize };
