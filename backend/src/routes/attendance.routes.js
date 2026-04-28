const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', attendanceController.getAttendance);
router.get('/summary/:studentId', attendanceController.getSummary);
router.get('/summary/me', authorize(ROLES.STUDENT), attendanceController.getSummary);

router.post('/', authorize(ROLES.ADMIN), attendanceController.markAttendance);
router.post('/bulk', authorize(ROLES.ADMIN), attendanceController.markBulkAttendance);

module.exports = router;
