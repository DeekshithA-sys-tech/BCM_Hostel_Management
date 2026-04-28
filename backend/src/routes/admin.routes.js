const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/verify/pending', adminController.getPendingStudents);
router.patch('/verify/:id', adminController.verifyStudent);
router.put('/students/verify/:id', adminController.verifyStudent);

module.exports = router;
