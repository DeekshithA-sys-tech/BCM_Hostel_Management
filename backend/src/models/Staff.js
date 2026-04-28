const mongoose = require('mongoose');
const { STAFF_ROLES } = require('../utils/constants');

const staffSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: 100
        },
        role: {
            type: String,
            required: [true, 'Role is required'],
            trim: true,
            maxlength: 100
        },
        mobile: {
            type: String,
            match: [/^[6-9]\d{9}$/, 'Invalid mobile number']
        },
        email: { type: String, lowercase: true },
        address: { type: String },
        joiningDate: { type: Date, default: Date.now },
        salary: { type: Number },
        isActive: { type: Boolean, default: true },
        photo: { type: String }
    },
    { timestamps: true }
);

staffSchema.index({ role: 1 });
staffSchema.index({ isActive: 1 });

module.exports = mongoose.model('Staff', staffSchema);
