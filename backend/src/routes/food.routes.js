const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Everyone can view schedule
router.get('/', foodController.getFoodSchedule);

// Admins only
router.put('/', authorize(ROLES.ADMIN), foodController.updateFoodSchedule);
router.post('/bulk', authorize(ROLES.ADMIN), foodController.bulkUpdateSchedule);

module.exports = router;
