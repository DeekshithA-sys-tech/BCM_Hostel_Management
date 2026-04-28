const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const submitComplaint = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) throw ApiError.notFound('Student profile');

        const { subject, description, category, priority } = req.body;
        const complaint = await Complaint.create({
            studentId: student._id, subject, description,
            category: category || 'other',
            priority: priority || 'medium',
            statusHistory: [{ status: 'open', changedBy: req.user._id }]
        });

        ApiResponse.created(res, { complaint }, 'Complaint submitted');
    } catch (err) {
        next(err);
    }
};

const getComplaints = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.status = status;

        if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user._id });
            if (!student) throw ApiError.notFound('Student profile');
            filter.studentId = student._id;
        }

        const [complaints, total] = await Promise.all([
            Complaint.find(filter)
                .populate('studentId', 'sspId')
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

        ApiResponse.success(res, { complaint }, 'Complaint status updated');
    } catch (err) {
        next(err);
    }
};

module.exports = { submitComplaint, getComplaints, updateComplaintStatus };
