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

        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            logger.error('❌ MONGO_URI is missing from environment variables!');
            logger.warn('👉 Please set the MONGO_URI environment variable in your cloud dashboard (e.g. Render Environment settings) with your MongoDB Atlas connection string.');
            return false;
        }

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
        });
        logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        logger.error(`❌ MongoDB Connection Error: ${error.message}`);
        logger.warn('👉 Check your connection string and ensure MongoDB Atlas IP Access List has 0.0.0.0/0 (Allow access from anywhere) enabled.');
        return false;
    }
};

module.exports = connectDB;
