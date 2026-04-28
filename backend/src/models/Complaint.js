const mongoose = require('mongoose');
const { COMPLAINT_STATUS } = require('../utils/constants');

const complaintSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: 2000
        },
        category: {
            type: String,
            enum: ['maintenance', 'food', 'security', 'facilities', 'staff', 'other'],
            default: 'other'
        },
        status: {
            type: String,
            enum: Object.values(COMPLAINT_STATUS),
            default: COMPLAINT_STATUS.OPEN
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        resolvedAt: { type: Date },
        resolution: { type: String },
        attachments: [{ type: String }],
        statusHistory: [
            {
                status: String,
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                changedAt: { type: Date, default: Date.now },
                remarks: String
            }
        ]
    },
    { timestamps: true }
);

complaintSchema.index({ studentId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
