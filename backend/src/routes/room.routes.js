const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoom);

// Admin only
router.post('/', authorize(ROLES.ADMIN), roomController.createRoom);
router.put('/:id', authorize(ROLES.ADMIN), roomController.updateRoom);
router.delete('/:id', authorize(ROLES.ADMIN), roomController.deleteRoom);
router.post('/allocate', authorize(ROLES.ADMIN), roomController.allocateStudent);
router.post('/deallocate', authorize(ROLES.ADMIN), roomController.deallocateStudent);

module.exports = router;
