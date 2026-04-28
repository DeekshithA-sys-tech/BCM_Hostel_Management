const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const generateAccessToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
};

const hashPassword = async (password) => {
    return bcrypt.hash(password, 12);
};

const comparePassword = async (plain, hashed) => {
    return bcrypt.compare(plain, hashed);
};

const register = async ({ email, password, name, role = 'student' }) => {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('Email already registered');

    const hashed = await hashPassword(password);
    const user = await User.create({ email: email.toLowerCase(), password: hashed, name, role });

    return user;
};

const login = async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token hash
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);
    return { user, accessToken, refreshToken };
};

const refreshTokens = async (token) => {
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
        throw ApiError.unauthorized('Refresh token reuse detected');
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (userId) => {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = { register, login, refreshTokens, logout, generateAccessToken, generateRefreshToken };
