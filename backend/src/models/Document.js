const mongoose = require('mongoose');
const { DOCUMENT_TYPES } = require('../utils/constants');

const documentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        type: {
            type: String,
            enum: Object.values(DOCUMENT_TYPES),
            required: true
        },
        fileData: {
            type: String, // Store Base64 directly
            required: true
        },
        fileName: { type: String },
        fileSize: { type: Number },
        mimeType: { type: String },
        isVerified: { type: Boolean, default: false },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: { type: Date },
        notes: { type: String }
    },
    { timestamps: true }
);

documentSchema.index({ studentId: 1, type: 1 });

module.exports = mongoose.model('Document', documentSchema);
