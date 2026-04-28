const mongoose = require('mongoose');
const { NOTIFICATION_SCOPE } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: 200
        },
        body: {
            type: String,
            required: [true, 'Body is required'],
            trim: true,
            maxlength: 2000
        },
        targetScope: {
            type: String,
            enum: Object.values(NOTIFICATION_SCOPE),
            default: NOTIFICATION_SCOPE.GLOBAL
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            default: null
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            default: null
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

notificationSchema.index({ targetScope: 1 });
notificationSchema.index({ roomId: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
