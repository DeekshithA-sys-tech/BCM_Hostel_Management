const mongoose = require('mongoose');
const { ATTENDANCE_SESSION, ATTENDANCE_STATUS } = require('../utils/constants');

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       properties:
 *         studentId:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         session:
 *           type: string
 *           enum: [morning, evening]
 *         status:
 *           type: string
 *           enum: [present, absent, leave]
 */
const attendanceSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        session: {
            type: String,
            enum: Object.values(ATTENDANCE_SESSION),
            required: true
        },
        status: {
            type: String,
            enum: Object.values(ATTENDANCE_STATUS),
            required: true,
            default: ATTENDANCE_STATUS.ABSENT
        },
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        remarks: { type: String }
    },
    { timestamps: true }
);

// Prevent duplicate attendance for same student/date/session
attendanceSchema.index({ studentId: 1, date: 1, session: 1 }, { unique: true });
attendanceSchema.index({ date: 1, session: 1 });
attendanceSchema.index({ studentId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
