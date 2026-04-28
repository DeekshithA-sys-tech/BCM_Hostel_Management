const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { upload } = require('../middleware/upload.middleware');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Admin: list all students
router.get('/', authorize(ROLES.ADMIN), studentController.getStudents);

// Student: own profile
router.get('/me', authorize(ROLES.STUDENT), studentController.getMyProfile);
router.put('/me', authorize(ROLES.STUDENT), studentController.updateStudent.bind(null));

// Student: complete profile & multi-document upload
router.put('/profile', 
    authorize(ROLES.STUDENT), 
    upload.fields([
        { name: 'aadhar', maxCount: 1 },
        { name: 'admission_letter', maxCount: 1 },
        { name: 'income_certificate', maxCount: 1 },
        { name: 'caste_certificate', maxCount: 1 },
        { name: 'sslc', maxCount: 1 },
        { name: 'puc', maxCount: 1 }
    ]), 
    studentController.updateStudentProfile
);

// Shared: get/update by ID
router.get('/:id', studentController.getStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', authorize(ROLES.ADMIN), studentController.deleteStudent);

// Document upload (legacy single upload)
router.post('/documents/upload',
    authorize(ROLES.STUDENT),
    upload.single('document'),
    studentController.uploadDocument
);

module.exports = router;
