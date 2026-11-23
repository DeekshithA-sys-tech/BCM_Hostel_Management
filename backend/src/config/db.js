const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Enforce strict query parsing and add global plugins to ensure
        // schema strictness and run validators on update operations.
        mongoose.set('strictQuery', true);

        // Plugin to ensure every schema defaults to strict mode
        mongoose.plugin((schema) => {
            if (schema.options.strict === undefined) schema.options.strict = true;
            // Ensure update operations run validators
            schema.pre('findOneAndUpdate', function () {
                this.setOptions({ runValidators: true, new: true });
            });
            schema.pre('updateOne', function () {
                this.setOptions({ runValidators: true });
            });
            schema.pre('updateMany', function () {
                this.setOptions({ runValidators: true });
            });
        });

        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_management';
        if (!process.env.MONGO_URI) {
            logger.warn('⚠️ MONGO_URI not found in environment, falling back to default localhost:27017.');
        }

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
        });
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
