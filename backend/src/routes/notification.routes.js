const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.post('/read/:id', notificationController.markRead);
router.post('/', authorize(ROLES.ADMIN), notificationController.createNotification);
router.delete('/:id', authorize(ROLES.ADMIN), notificationController.deleteNotification);

module.exports = router;
