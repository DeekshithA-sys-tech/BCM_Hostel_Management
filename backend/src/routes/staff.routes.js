const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', staffController.getStaff);
router.post('/', authorize(ROLES.ADMIN), staffController.createStaff);
router.put('/:id', authorize(ROLES.ADMIN), staffController.updateStaff);
router.delete('/:id', authorize(ROLES.ADMIN), staffController.deleteStaff);

module.exports = router;
