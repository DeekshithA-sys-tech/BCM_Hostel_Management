const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');

/**
 * Mark or update attendance for a student.
 */
const markAttendance = async ({ studentId, date, session, status, markedBy, remarks }) => {
    const student = await Student.findById(studentId);
    if (!student) throw ApiError.notFound('Student');

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
        { studentId, date: attendanceDate, session },
        { status, markedBy, remarks },
        { upsert: true, new: true, runValidators: true }
    );

    return record;
};

/**
 * Mark bulk attendance for multiple students at once.
 */
const markBulkAttendance = async (records, markedBy) => {
    const ops = records.map(({ studentId, date, session, status, remarks }) => {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        return {
            updateOne: {
                filter: { studentId, date: attendanceDate, session },
                update: { $set: { status, markedBy, remarks } },
                upsert: true
            }
        };
    });

    return Attendance.bulkWrite(ops);
};

/**
 * Get attendance summary for a student over a date range.
 */
const getStudentSummary = async (studentId, startDate, endDate) => {
    const match = { studentId: require('mongoose').Types.ObjectId(studentId) };
    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }

    const summary = await Attendance.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const result = { present: 0, absent: 0, leave: 0, total: 0 };
    summary.forEach(({ _id, count }) => {
        result[_id] = count;
        result.total += count;
    });
    result.percentage = result.total > 0 ? Math.round((result.present / result.total) * 100) : 0;
    return result;
};

module.exports = { markAttendance, markBulkAttendance, getStudentSummary };
