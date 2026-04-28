const Student = require('../models/Student');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { sendVerificationUpdate } = require('../services/mail.service');

/**
 * List pending students for verification
 */
const getPendingStudents = async (req, res, next) => {
    try {
        const students = await Student.find({
            $or: [
                { verificationStatus: 'pending' },
                { proposedUpdates: { $ne: null } }
            ]
        })
            .populate('userId', 'name email createdAt')
            .sort({ createdAt: -1 });

        ApiResponse.success(res, { students, count: students.length });
    } catch (err) {
        next(err);
    }
};

/**
 * Approve or reject a student
 */
const verifyStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action, remarks } = req.body; // action: 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            throw ApiError.badRequest('Action must be approve or reject');
        }

        const student = await Student.findById(id);
        if (!student) throw ApiError.notFound('Student');

        const status = action === 'approve' ? 'approved' : 'rejected';

        if (action === 'approve') {
            if (student.proposedUpdates) {
                // Apply proposed updates natively
                for (const key in student.proposedUpdates) {
                    student[key] = student.proposedUpdates[key];
                }
                student.proposedUpdates = null;
                // keep status as approved
            } else {
                student.verificationStatus = 'approved';
            }
        } else {
            if (student.proposedUpdates) {
                // Reject updates
                student.proposedUpdates = null;
            } else {
                student.verificationStatus = 'rejected';
            }
        }

        student.verificationRemarks = remarks;
        student.verifiedBy = req.user._id;
        student.verifiedAt = new Date();

        await student.save();
        await student.populate('userId', 'name email');

        // Email notification (non-blocking)
        if (student.userId?.email) {
            sendVerificationUpdate(student.userId.email, student.userId.name, status, remarks).catch(() => { });
        }

        ApiResponse.success(res, { student }, `Student ${status} successfully`);
    } catch (err) {
        next(err);
    }
};

module.exports = { getPendingStudents, verifyStudent };
