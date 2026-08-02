const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ROLES } = require('./constants');
const logger = require('./logger');

const seedAdmin = async () => {
    try {
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hostel.com').toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
        const existing = await User.findOne({ email: adminEmail });

        if (!existing) {
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await User.create({
                email: adminEmail,
                password: hashedPassword,
                role: ROLES.ADMIN,
                name: 'System Administrator',
                isActive: true
            });
            logger.info(`✅ Admin seeded: ${adminEmail}`);
            return;
        }

        const needsRepair = existing.role !== ROLES.ADMIN || !existing.isActive || existing.name !== 'System Administrator';
        if (needsRepair) {
            const hashedPassword = await bcrypt.hash(adminPassword, 12);
            await User.findByIdAndUpdate(existing._id, {
                role: ROLES.ADMIN,
                name: 'System Administrator',
                isActive: true,
                password: hashedPassword
            }, { new: true });
            logger.info(`🔧 Admin account repaired: ${adminEmail}`);
        }
    } catch (err) {
        logger.error('Admin seed error:', err.message);
    }
};

module.exports = { seedAdmin };
