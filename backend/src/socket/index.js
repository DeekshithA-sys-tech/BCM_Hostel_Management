const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Map: userId → Set of socket IDs (one user can have multiple tabs)
const userSockets = new Map();
// Map: socketId → userId
const socketUsers = new Map();

let ioInstance = null;

const initSocket = (httpServer) => {
    const { Server } = require('socket.io');

    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => callback(null, true),
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 30000,
        pingInterval: 25000
    });

    ioInstance = io;

    // ── Auth Middleware ────────────────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('No token provided'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.user = decoded; // { id, role }
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    // ── Connection Handler ─────────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        logger.info(`Socket connected: ${socket.id} | user=${userId} role=${userRole}`);

        // Track socket → user mapping
        socketUsers.set(socket.id, userId);
        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId).add(socket.id);

        // Join role-based rooms
        socket.join(`role:${userRole}`);          // 'role:admin' or 'role:student'
        socket.join(`user:${userId}`);             // personal room

        // ── Student: join personal complaint room ──────────────────────────────
        socket.on('complaint:join', (complaintId) => {
            socket.join(`complaint:${complaintId}`);
        });

        // ── Admin: new notification broadcast ─────────────────────────────────
        // Handled by HTTP controller which calls io.emit after DB save

        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id}`);
            socketUsers.delete(socket.id);
            const set = userSockets.get(userId);
            if (set) {
                set.delete(socket.id);
                if (set.size === 0) userSockets.delete(userId);
            }
        });
    });

    logger.info('🔌 Socket.io server initialized');
    return io;
};

// Helper: emit to all students
const emitToStudents = (event, data) => {
    if (ioInstance) ioInstance.to('role:student').emit(event, data);
};

// Helper: emit to a specific user
const emitToUser = (userId, event, data) => {
    if (ioInstance) ioInstance.to(`user:${userId}`).emit(event, data);
};

// Helper: emit to a specific room (complaint room)
const emitToComplaint = (complaintId, event, data) => {
    if (ioInstance) ioInstance.to(`complaint:${complaintId}`).emit(event, data);
};

// Helper: emit to all admins
const emitToAdmins = (event, data) => {
    if (ioInstance) ioInstance.to('role:admin').emit(event, data);
};

const getIO = () => ioInstance;

module.exports = { initSocket, getIO, emitToStudents, emitToUser, emitToComplaint, emitToAdmins };
