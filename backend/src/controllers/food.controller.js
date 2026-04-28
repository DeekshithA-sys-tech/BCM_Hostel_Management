const FoodSchedule = require('../models/FoodSchedule');
const ApiResponse = require('../utils/ApiResponse');
const { WEEKDAYS } = require('../utils/constants');

const getFoodSchedule = async (req, res, next) => {
    try {
        const schedule = await FoodSchedule.find().sort({ _id: 1 });

        // Return all 7 days with empty defaults for missing days
        const result = WEEKDAYS.map((day) => {
            const found = schedule.find((s) => s.weekday === day);
            return found ? found.toObject() : { weekday: day, meals: [] };
        });

        ApiResponse.success(res, { schedule: result });
    } catch (err) {
        next(err);
    }
};

const updateFoodSchedule = async (req, res, next) => {
    try {
        const { weekday, meals } = req.body;

        const schedule = await FoodSchedule.findOneAndUpdate(
            { weekday },
            { meals, updatedBy: req.user._id },
            { upsert: true, new: true, runValidators: true }
        );

        ApiResponse.success(res, { schedule }, 'Food schedule updated');
    } catch (err) {
        next(err);
    }
};

const bulkUpdateSchedule = async (req, res, next) => {
    try {
        const { schedule } = req.body; // [{ weekday, meals }]
        const ops = schedule.map(({ weekday, meals }) => ({
            updateOne: {
                filter: { weekday },
                update: { $set: { meals, updatedBy: req.user._id } },
                upsert: true
            }
        }));
        await FoodSchedule.bulkWrite(ops);
        ApiResponse.success(res, null, 'Full schedule updated');
    } catch (err) {
        next(err);
    }
};

module.exports = { getFoodSchedule, updateFoodSchedule, bulkUpdateSchedule };
