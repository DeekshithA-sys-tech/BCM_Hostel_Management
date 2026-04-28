const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];
        if (!token) throw ApiError.unauthorized('Invalid token format');

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Token expired');
            throw ApiError.unauthorized('Invalid token');
        }

        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user) throw ApiError.unauthorized('User no longer exists');
        if (!user.isActive) throw ApiError.forbidden('Account is deactivated');

        // Check if password was changed after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            throw ApiError.unauthorized('Password recently changed. Please log in again.');
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { authenticate };
