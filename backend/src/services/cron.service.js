const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const logger = require('../utils/logger');

/**
 * Daily attendance alert — runs at 9 PM to flag students with < 75% attendance.
 */
const startAttendanceAlert = () => {
    cron.schedule('0 21 * * *', async () => {
        logger.info('⏰ Cron: Running attendance alert check...');
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const students = await Student.find({ isActive: true, verificationStatus: 'approved' })
                .populate('userId', 'email name');

            for (const student of students) {
                const total = await Attendance.countDocuments({
                    studentId: student._id,
                    date: { $gte: thirtyDaysAgo }
                });

                if (total === 0) continue;

                const present = await Attendance.countDocuments({
                    studentId: student._id,
                    date: { $gte: thirtyDaysAgo },
                    status: 'present'
                });

                const percentage = (present / total) * 100;
                if (percentage < 75) {
                    logger.warn(`⚠️ Low attendance: ${student.userId?.name} — ${percentage.toFixed(1)}%`);
                    // TODO: Push notification / email to student & admin
                }
            }
            logger.info('✅ Cron: Attendance alert check completed');
        } catch (err) {
            logger.error('Cron attendance error:', err.message);
        }
    }, { timezone: 'Asia/Kolkata' });

    logger.info('📅 Cron jobs scheduled');
};

module.exports = { startAttendanceAlert };
