const mongoose = require('mongoose');

const cotSchema = new mongoose.Schema(
    {
        cotNumber: {
            type: String,
            required: [true, 'Cot number is required'],
            trim: true
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            default: null
        },
        isOccupied: {
            type: Boolean,
            default: false
        },
        allocatedAt: { type: Date },
        notes: { type: String }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true }
    }
);

cotSchema.index({ roomId: 1 });
cotSchema.index({ studentId: 1 });
cotSchema.index({ isOccupied: 1 });

// Compound unique index
cotSchema.index({ roomId: 1, cotNumber: 1 }, { unique: true });

module.exports = mongoose.model('Cot', cotSchema);
