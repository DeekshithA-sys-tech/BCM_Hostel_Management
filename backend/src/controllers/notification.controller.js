const Notification = require('../models/Notification');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Student = require('../models/Student');

const createNotification = async (req, res, next) => {
    try {
        const { title, body, targetScope, roomId, studentId } = req.body;
        const notification = await Notification.create({
            title, body, targetScope: targetScope || 'global',
            roomId: roomId || null,
            studentId: studentId || null,
            createdBy: req.user._id
        });
        ApiResponse.created(res, { notification }, 'Notification sent');
    } catch (err) {
        next(err);
    }
};

const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let filter = { isActive: true };

        if (req.user.role === 'student') {
            // Get student's room
            const student = await Student.findOne({ userId: req.user._id }).populate('cotId');
            const roomId = student?.cotId?.roomId;

            filter.$or = [
                { targetScope: 'global' },
                { targetScope: 'individual', studentId: student?._id }
            ];
            if (roomId) filter.$or.push({ targetScope: 'room', roomId });
        }

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Notification.countDocuments(filter)
        ]);

        ApiResponse.paginated(res, notifications, { page: parseInt(page), limit: parseInt(limit), total });
    } catch (err) {
        next(err);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const notif = await Notification.findByIdAndUpdate(req.params.id, { isActive: false });
        if (!notif) throw ApiError.notFound('Notification');
        ApiResponse.success(res, null, 'Notification deleted');
    } catch (err) {
        next(err);
    }
};

const markRead = async (req, res, next) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, {
            $addToSet: { readBy: req.user._id }
        });
        ApiResponse.success(res, null, 'Marked as read');
    } catch (err) {
        next(err);
    }
};

module.exports = { createNotification, getNotifications, deleteNotification, markRead };
