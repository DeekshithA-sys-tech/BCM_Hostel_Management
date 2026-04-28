const mongoose = require('mongoose');
const { VERIFICATION_STATUS } = require('../utils/constants');

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         sspId:
 *           type: string
 *         userId:
 *           type: string
 *         verificationStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 */
const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        sspId: {
            type: String,
            required: [true, 'SSP ID is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        // Personal Details
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
        mobile: { type: String, match: [/^[6-9]\d{9}$/, 'Invalid mobile number'] },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' }
        },
        // Academic Details
        institution: { type: String, trim: true },
        course: { type: String, trim: true },
        year: { type: Number, min: 1, max: 6 },
        rollNumber: { type: String, trim: true },
        // Guardian Details
        guardian: {
            name: { type: String, trim: true },
            relation: { type: String, trim: true },
            mobile: { type: String },
            email: { type: String }
        },
        // Verification
        verificationStatus: {
            type: String,
            enum: Object.values(VERIFICATION_STATUS),
            default: VERIFICATION_STATUS.PENDING
        },
        verificationRemarks: { type: String },
        proposedUpdates: { type: mongoose.Schema.Types.Mixed, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },
        // Room/Cot allocation
        cotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cot', default: null },
        joinDate: { type: Date, default: Date.now },
        leaveDate: { type: Date },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

studentSchema.index({ userId: 1 });
studentSchema.index({ sspId: 1 });
studentSchema.index({ verificationStatus: 1 });
studentSchema.index({ cotId: 1 });

// Virtual for getting user details
studentSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

module.exports = mongoose.model('Student', studentSchema);
