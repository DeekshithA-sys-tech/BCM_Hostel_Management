const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { emitToAdmins, emitToUser, emitToComplaint } = require('../socket');

// ── Submit a Complaint ────────────────────────────────────────────────────────
const submitComplaint = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) throw ApiError.badRequest('Please complete your profile before submitting a complaint');

        const { subject, description, category, priority } = req.body;
        const complaint = await Complaint.create({
            studentId: student._id,
            subject,
            description,
            category: category || 'other',
            priority: priority || 'medium',
            statusHistory: [{ status: 'open', changedBy: req.user._id }]
        });

        // Populate for socket payload
        const populated = await Complaint.findById(complaint._id)
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

        // ── Real-time: notify all admins of new complaint ─────────────────────
        emitToAdmins('complaint:new', {
            _id: populated._id,
            subject: populated.subject,
            description: populated.description,
            category: populated.category,
            priority: populated.priority,
            status: populated.status,
            createdAt: populated.createdAt,
            studentId: {
                sspId: populated.studentId?.sspId,
                userId: { name: populated.studentId?.userId?.name }
            }
        });

        ApiResponse.created(res, { complaint: populated }, 'Complaint submitted');
    } catch (err) {
        next(err);
    }
};

// ── Get Complaints ────────────────────────────────────────────────────────────
const getComplaints = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.status = status;

        if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) {
                return ApiResponse.paginated(res, [], { page: 1, limit: parseInt(limit), total: 0 });
            }
            filter.studentId = student._id;
        }

        const [complaints, total] = await Promise.all([
            Complaint.find(filter)
                .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Complaint.countDocuments(filter)
        ]);

        ApiResponse.paginated(res, complaints, { page: parseInt(page), limit: parseInt(limit), total });
    } catch (err) {
        next(err);
    }
};

// ── Update Complaint Status (Admin resolves) ──────────────────────────────────
const updateComplaintStatus = async (req, res, next) => {
    try {
        const { status, remarks, resolution } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) throw ApiError.notFound('Complaint');

        complaint.status = status;
        if (resolution) complaint.resolution = resolution;
        if (status === 'resolved') complaint.resolvedAt = new Date();
        complaint.statusHistory.push({ status, changedBy: req.user._id, remarks });
        await complaint.save();

        // Populate for socket payload
        const populated = await Complaint.findById(complaint._id)
            .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });

        const socketPayload = {
            _id: populated._id,
            subject: populated.subject,
            status: populated.status,
            resolution: populated.resolution,
            resolvedAt: populated.resolvedAt,
            updatedAt: populated.updatedAt
        };

        // ── Real-time: notify the specific student ────────────────────────────
        if (populated.studentId?.userId?._id) {
            emitToUser(populated.studentId.userId._id.toString(), 'complaint:updated', socketPayload);
        }

        // ── Real-time: update the complaint room (both student and admin) ─────
        emitToComplaint(populated._id.toString(), 'complaint:updated', socketPayload);

        ApiResponse.success(res, { complaint: populated }, 'Complaint status updated');
    } catch (err) {
        next(err);
    }
};

module.exports = { submitComplaint, getComplaints, updateComplaintStatus };
