require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { swaggerUi, swaggerSpec } = require('./config/swagger');
const errorHandler = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const adminRoutes = require('./routes/admin.routes');
const roomRoutes = require('./routes/room.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const notificationRoutes = require('./routes/notification.routes');
const complaintRoutes = require('./routes/complaint.routes');
const staffRoutes = require('./routes/staff.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const foodRoutes = require('./routes/food.routes');

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ── Static Uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Docs ──────────────────────────────────────────────────────────────────
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HMS API Documentation'
}));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── API Routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/students`, studentRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/rooms`, roomRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/complaints`, complaintRoutes);
app.use(`${API}/staff`, staffRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/food`, foodRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
