const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const ApiResponse = require('../utils/ApiResponse');

const getStats = async (req, res, next) => {
    try {
        const totalStudents = await Student.countDocuments({ verificationStatus: 'approved' });
        const pendingApprovals = await Student.countDocuments({ verificationStatus: 'pending' });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const presentToday = await Attendance.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay },
            status: 'present'
        });

        ApiResponse.success(res, {
            totalStudents,
            pendingApprovals,
            presentToday
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getStats };
