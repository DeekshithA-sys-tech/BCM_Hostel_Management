const mongoose = require('mongoose');
const { WEEKDAYS, MEAL_TYPES } = require('../utils/constants');

const mealSchema = new mongoose.Schema({
    type: { type: String, enum: MEAL_TYPES, required: true },
    items: [{ type: String, trim: true }],
    time: { type: String } // e.g., "07:00 AM"
}, { _id: false });

const foodScheduleSchema = new mongoose.Schema(
    {
        weekday: {
            type: String,
            enum: WEEKDAYS,
            required: true,
            unique: true
        },
        meals: [mealSchema],
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('FoodSchedule', foodScheduleSchema);
