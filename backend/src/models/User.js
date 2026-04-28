const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, student]
 *         isActive:
 *           type: boolean
 */
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name too long']
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.STUDENT
        },
        refreshToken: {
            type: String,
            select: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: {
            type: Date
        },
        passwordChangedAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.refreshToken;
                delete ret.__v;
                return ret;
            }
        }
    }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedAt;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
