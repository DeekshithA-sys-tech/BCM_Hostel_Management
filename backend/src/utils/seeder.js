const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES } = require('./constants');
const logger = require('./logger');

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@hostel.com';
        const existing = await User.findOne({ email: adminEmail });

        if (!existing) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
            await User.create({
                email: adminEmail,
                password: hashedPassword,
                role: ROLES.ADMIN,
                name: 'System Administrator',
                isActive: true
            });
            logger.info(`✅ Admin seeded: ${adminEmail}`);
        }
    } catch (err) {
        logger.error('Admin seed error:', err.message);
    }
};

module.exports = { seedAdmin };
