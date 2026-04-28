const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const attendanceService = require('../services/attendance.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Mark single attendance
 */
const markAttendance = async (req, res, next) => {
    try {
        const { studentId, date, session, status, remarks } = req.body;
        const record = await attendanceService.markAttendance({
            studentId, date: date || new Date(), session, status, markedBy: req.user._id, remarks
        });
        ApiResponse.success(res, { attendance: record }, 'Attendance marked');
    } catch (err) {
        next(err);
    }
};

/**
 * Mark bulk attendance
 */
const markBulkAttendance = async (req, res, next) => {
    try {
        const { records } = req.body; // [{ studentId, date, session, status }]
        if (!Array.isArray(records) || records.length === 0) {
            throw ApiError.badRequest('Records array is required');
        }
        const result = await attendanceService.markBulkAttendance(records, req.user._id);
        ApiResponse.success(res, { result }, 'Bulk attendance marked');
    } catch (err) {
        next(err);
    }
};

/**
 * Get attendance (admin: all, student: own)
 */
const getAttendance = async (req, res, next) => {
    try {
        const { studentId, startDate, endDate, session, page = 1, limit = 20 } = req.query;

        const filter = {};

        if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) throw ApiError.notFound('Student profile');
            filter.studentId = student._id;
        } else if (studentId) {
            filter.studentId = studentId;
        }

        if (session) filter.session = session;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [records, total] = await Promise.all([
            Attendance.find(filter)
                .populate('studentId', 'sspId')
                .populate('markedBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Attendance.countDocuments(filter)
        ]);

        ApiResponse.paginated(res, records, { page: parseInt(page), limit: parseInt(limit), total });
    } catch (err) {
        next(err);
    }
};

/**
 * Get attendance summary for a student
 */
const getSummary = async (req, res, next) => {
    try {
        let studentId = req.params.studentId;

        if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) throw ApiError.notFound('Student profile');
            studentId = student._id.toString();
        }

        const { startDate, endDate } = req.query;
        const summary = await attendanceService.getStudentSummary(studentId, startDate, endDate);
        ApiResponse.success(res, { summary });
    } catch (err) {
        next(err);
    }
};

module.exports = { markAttendance, markBulkAttendance, getAttendance, getSummary };
