const Notification = require('../models/Notification');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Student = require('../models/Student');
const { emitToStudents, emitToUser, emitToAdmins } = require('../socket');

// ── Create / Broadcast Notification ──────────────────────────────────────────
const createNotification = async (req, res, next) => {
    try {
        const { title, body, targetScope, roomId, studentId } = req.body;

        if (!title || !body) {
            return next(ApiError.badRequest('Title and body are required'));
        }

        const notification = await Notification.create({
            title,
            body,
            targetScope: targetScope || 'global',
            roomId: roomId || null,
            studentId: studentId || null,
            createdBy: req.user._id
        });

        // ── Real-time WebSocket Dispatch ──────────────────────────────────────
        const payload = {
            _id: notification._id,
            title: notification.title,
            body: notification.body,
            targetScope: notification.targetScope,
            createdAt: notification.createdAt
        };

        switch (notification.targetScope) {
            case 'global':
                // Broadcast to ALL students
                emitToStudents('notification:new', payload);
                break;

            case 'room':
                // We'd need to emit to each student in the room — simplified: broadcast to students
                emitToStudents('notification:new', { ...payload, roomId });
                break;

            case 'individual':
                if (studentId) {
                    // Find the student's userId to emit to their personal socket room
                    const student = await Student.findById(studentId).select('userId');
                    if (student) {
                        emitToUser(student.userId.toString(), 'notification:new', payload);
                    }
                }
                break;
        }

        ApiResponse.created(res, { notification }, 'Notification broadcast sent');
    } catch (err) {
        next(err);
    }
};

// ── Get Notifications (student sees own, admin sees all) ──────────────────────
const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let filter = { isActive: true };

        if (req.user.role === 'student') {
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

// ── Delete Notification ───────────────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
    try {
        const notif = await Notification.findByIdAndUpdate(req.params.id, { isActive: false });
        if (!notif) throw ApiError.notFound('Notification');
        ApiResponse.success(res, null, 'Notification deleted');
    } catch (err) {
        next(err);
    }
};

// ── Mark Notification as Read ─────────────────────────────────────────────────
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
