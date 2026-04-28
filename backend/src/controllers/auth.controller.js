const authService = require('../services/auth.service');
const Student = require('../models/Student');
const ApiResponse = require('../utils/ApiResponse');
const { sendWelcome } = require('../services/mail.service');
const { ROLES } = require('../utils/constants');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new student account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, sspId]
 *             properties:
 *               email: { type: string }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               sspId: { type: string }
 */
const register = async (req, res, next) => {
    try {
        const { email, password, name, sspId } = req.body;

        const user = await authService.register({ email, password, name, role: ROLES.STUDENT });

        // Create student profile
        const student = await Student.create({ userId: user._id, sspId: sspId.toUpperCase() });

        // Send welcome email (non-blocking)
        sendWelcome(user.email, user.name).catch(() => { });

        ApiResponse.created(res, {
            user: { _id: user._id, email: user.email, name: user.name, role: user.role },
            student: { _id: student._id, sspId: student.sspId, verificationStatus: student.verificationStatus }
        }, 'Registration successful. Await admin verification.');
    } catch (err) {
        next(err);
    }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get JWT tokens
 *     security: []
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.login(email, password);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        ApiResponse.success(res, {
            user: { _id: user._id, email: user.email, name: user.name, role: user.role },
            accessToken
        }, 'Login successful');
    } catch (err) {
        next(err);
    }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 */
const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!token) {
            return res.status(401).json({ success: false, message: 'No refresh token provided' });
        }

        const { accessToken, refreshToken } = await authService.refreshTokens(token);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        ApiResponse.success(res, { accessToken }, 'Token refreshed');
    } catch (err) {
        next(err);
    }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user
 */
const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user._id);
        res.clearCookie('refreshToken');
        ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 */
const getMe = async (req, res, next) => {
    try {
        ApiResponse.success(res, { user: req.user }, 'Profile fetched');
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, refresh, logout, getMe };
