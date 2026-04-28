const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', complaintController.getComplaints);
router.post('/', authorize(ROLES.STUDENT), complaintController.submitComplaint);
router.patch('/:id/status', authorize(ROLES.ADMIN), complaintController.updateComplaintStatus);

module.exports = router;
