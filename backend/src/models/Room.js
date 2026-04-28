const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Room:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         roomNumber:
 *           type: string
 *         floor:
 *           type: number
 *         totalCots:
 *           type: number
 *         occupiedCots:
 *           type: number
 */
const roomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: [true, 'Room number is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        floor: {
            type: Number,
            required: [true, 'Floor is required'],
            min: 0
        },
        block: {
            type: String,
            trim: true,
            default: 'A'
        },
        totalCots: {
            type: Number,
            required: true,
            min: 1,
            max: 20
        },
        type: {
            type: String,
            enum: ['general', 'ac', 'suite'],
            default: 'general'
        },
        amenities: [{ type: String }],
        isActive: {
            type: Boolean,
            default: true
        },
        notes: { type: String }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

roomSchema.index({ floor: 1 });
roomSchema.index({ roomNumber: 1 });

// Virtual: list of cots
roomSchema.virtual('cots', {
    ref: 'Cot',
    localField: '_id',
    foreignField: 'roomId'
});

// Virtual: occupied count (computed via aggregation, not here)
roomSchema.virtual('occupiedCots').get(function () {
    return undefined; // populated via aggregation pipeline in service
});

module.exports = mongoose.model('Room', roomSchema);
