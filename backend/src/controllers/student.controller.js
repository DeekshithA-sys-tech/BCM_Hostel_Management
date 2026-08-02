const Student = require('../models/Student');
const Document = require('../models/Document');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { DEFAULT_PAGE, DEFAULT_LIMIT } = require('../utils/constants');
const path = require('path');

/**
 * Get all students (admin) or own profile (student)
 */
const getStudents = async (req, res, next) => {
    try {
        const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.verificationStatus = status;
        if (search) {
            // Join with User to search by name/email - use aggregation
        }

        const [students, total] = await Promise.all([
            Student.find(filter)
                .populate('userId', 'name email isActive')
                .populate('cotId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Student.countDocuments(filter)
        ]);

        ApiResponse.paginated(res, students, {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get single student by ID
 */
const getStudent = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Students can only view their own profile
        let filter = { _id: id };
        if (req.user.role === 'student') {
            filter.userId = req.user._id;
        }

        const student = await Student.findOne(filter)
            .populate('userId', 'name email createdAt')
            .populate('cotId')
            .populate('verifiedBy', 'name email');

        if (!student) throw ApiError.notFound('Student');

        const documents = await Document.find({ studentId: student._id });

        ApiResponse.success(res, { student, documents });
    } catch (err) {
        next(err);
    }
};

/**
 * Get own student profile
 */
const getMyProfile = async (req, res, next) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate('userId', 'name email createdAt')
            .populate({
                path: 'cotId',
                populate: { path: 'roomId', select: 'roomNumber block floor' }
            });

        if (!student) {
            // Student profile not created yet — return a flag so frontend can redirect to profile setup
            return ApiResponse.success(res, {
                student: null,
                needsProfile: true,
                user: {
                    _id: req.user._id,
                    name: req.user.name,
                    email: req.user.email
                }
            }, 'Student profile not yet created. Please complete your profile.');
        }

        const documents = await Document.find({ studentId: student._id });
        ApiResponse.success(res, { student, documents });
    } catch (err) {
        next(err);
    }
};

/**
 * Update student profile
 */
    const updateStudent = async (req, res, next) => {
        try {
            const { id } = req.params;
            const allowedFields = [
                'dateOfBirth', 'gender', 'bloodGroup', 'mobile', 'address',
                'institution', 'course', 'year', 'rollNumber', 'guardian', 'sspId'
            ];
    
            const updates = {};
            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) updates[field] = req.body[field];
            });
    
            let filter = {};
            if (req.user.role === 'student') {
                filter.userId = req.user._id;
            } else {
                filter._id = id;
            }
    
            const student = await Student.findOneAndUpdate(filter, updates, {
            new: true, runValidators: true
        }).populate('userId', 'name email');

        if (!student) throw ApiError.notFound('Student');

        ApiResponse.success(res, { student }, 'Profile updated');
    } catch (err) {
        next(err);
    }
};

/**
 * Upload document for student
 */
const uploadDocument = async (req, res, next) => {
    try {
        if (!req.file) throw ApiError.badRequest('No file uploaded');

        const student = await Student.findOne({ userId: req.user._id });
        if (!student) throw ApiError.notFound('Student profile');

        const { type } = req.body;
        let updateObj = {
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            isVerified: false
        };

        // If multer used memoryStorage, buffer will be present — store as base64
        if (req.file?.buffer) {
            updateObj.fileData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        } else if (req.file?.path) {
            // Disk storage: expose via /uploads/<userId>/<filename>
            const userId = req.user._id;
            updateObj.fileUrl = `/uploads/${userId}/${req.file.filename}`;
        }

        const doc = await Document.findOneAndUpdate(
            { studentId: student._id, type },
            updateObj,
            { upsert: true, new: true }
        );

        ApiResponse.created(res, { document: doc }, 'Document uploaded to database');
    } catch (err) {
        next(err);
    }
};

const updateStudentProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let student = await Student.findOne({ userId });

        // Auto-create student profile if registration didn't complete it
        if (!student) {
            const { sspId } = req.body;
            if (!sspId) {
                return next(ApiError.badRequest('SSP ID is required to create your profile for the first time'));
            }
            student = await Student.create({ userId, sspId: sspId.toUpperCase() });
        }

        const {
            dateOfBirth, gender, bloodGroup, mobile, institution, course, year, rollNumber, sspId,
            guardianName, guardianMobile, street, city, state, pincode
        } = req.body;

        const updates = {};
        if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
        if (gender) updates.gender = gender;
        if (bloodGroup) updates.bloodGroup = bloodGroup;
        if (mobile) updates.mobile = mobile;
        if (institution) updates.institution = institution;
        if (course) updates.course = course;
        if (year) updates.year = year;
        if (rollNumber) updates.rollNumber = rollNumber;
        if (sspId) updates.sspId = sspId.toUpperCase();

        if (guardianName || guardianMobile) {
            updates.guardian = {
                name: guardianName || student.guardian?.name,
                mobile: guardianMobile || student.guardian?.mobile
            };
        }

        if (street || city || state || pincode) {
            updates.address = {
                street: street || student.address?.street,
                city: city || student.address?.city,
                state: state || student.address?.state,
                pincode: pincode || student.address?.pincode
            };
        }

        // If already approved, queue changes as proposed updates
        if (student.verificationStatus === 'approved') {
            student = await Student.findOneAndUpdate(
                { userId },
                { $set: { proposedUpdates: updates } },
                { new: true, runValidators: true }
            ).populate('userId', 'name email');
        } else {
            student = await Student.findOneAndUpdate(
                { userId },
                { $set: updates },
                { new: true, runValidators: true }
            ).populate('userId', 'name email');
        }

        // Map upload field names to valid Document type enum values
        const FIELD_TO_DOCTYPE = {
            aadhar: 'aadhaar',
            aadhaar: 'aadhaar',
            admission_letter: 'other',
            income_certificate: 'income_certificate',
            caste_certificate: 'caste_certificate',
            sslc: 'other',
            puc: 'other',
            photo: 'photo',
            bank_passbook: 'bank_passbook'
        };

        // Handle uploaded documents
        if (req.files && Object.keys(req.files).length > 0) {
            const docPromises = Object.keys(req.files).map(async (fieldname) => {
                const files = req.files[fieldname];
                const file = Array.isArray(files) ? files[0] : files;
                if (!file) return null;

                const docType = FIELD_TO_DOCTYPE[fieldname] || 'other';

                const updateObj = {
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    isVerified: false
                };

                if (file?.buffer) {
                    updateObj.fileData = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                } else if (file?.path) {
                    updateObj.fileUrl = `/uploads/${userId}/${path.basename(file.path)}`;
                }

                return Document.findOneAndUpdate(
                    { studentId: student._id, type: docType },
                    updateObj,
                    { upsert: true, new: true }
                );
            });
            await Promise.all(docPromises);
        }

        const documents = await Document.find({ studentId: student._id });

        // Emit real-time socket notification to all admins about new/updated approval request
        try {
            const { emitToAdmins } = require('../socket');
            emitToAdmins('approval:new', {
                studentId: student._id,
                name: req.user.name,
                email: req.user.email,
                type: student.verificationStatus === 'approved' ? 'update' : 'new'
            });
        } catch (e) {
            console.error('Socket emit error:', e.message);
        }

        ApiResponse.success(res, { student, documents }, 'Profile submitted for verification. Pending admin review.');
    } catch (err) {
        next(err);
    }
};

/**
 * Create student profile (initial submission)
 */
const createStudentProfile = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let student = await Student.findOne({ userId });
        if (student) throw ApiError.conflict('Student profile already exists');

        const {
            dateOfBirth, gender, bloodGroup, mobile, institution, course, year, rollNumber, sspId,
            guardianName, guardianMobile, street, city, state, pincode
        } = req.body;

        const studentObj = { userId };
        if (sspId) studentObj.sspId = sspId;
        if (dateOfBirth) studentObj.dateOfBirth = dateOfBirth;
        if (gender) studentObj.gender = gender;
        if (bloodGroup) studentObj.bloodGroup = bloodGroup;
        if (mobile) studentObj.mobile = mobile;
        if (institution) studentObj.institution = institution;
        if (course) studentObj.course = course;
        if (year) studentObj.year = year;
        if (rollNumber) studentObj.rollNumber = rollNumber;

        if (guardianName || guardianMobile) {
            studentObj.guardian = {
                name: guardianName || undefined,
                mobile: guardianMobile || undefined
            };
        }

        if (street || city || state || pincode) {
            studentObj.address = {
                street: street || undefined,
                city: city || undefined,
                state: state || undefined,
                pincode: pincode || undefined
            };
        }

        student = await Student.create(studentObj);

        // Handle uploaded documents
        if (req.files) {
            const docPromises = Object.keys(req.files).map(async (fieldname) => {
                const file = req.files[fieldname][0];
                const fileUrl = `/uploads/${userId}/${file.filename}`;
                return Document.findOneAndUpdate(
                    { studentId: student._id, type: fieldname },
                    {
                        fileUrl,
                        fileName: file.originalname,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        isVerified: false
                    },
                    { upsert: true, new: true }
                );
            });
            await Promise.all(docPromises);
        }

        const documents = await Document.find({ studentId: student._id });

        ApiResponse.created(res, { student, documents }, 'Profile created');
    } catch (err) {
        next(err);
    }
};

const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const student = await Student.findByIdAndUpdate(id, { isActive: false }, { new: true });
        
        if (!student) throw ApiError.notFound('Student');

        // Deallocate if they have a cot
        if (student.cotId) {
            const Cot = require('../models/Cot');
            await Cot.findByIdAndUpdate(student.cotId, { studentId: null, isOccupied: false });
            student.cotId = null;
            await student.save();
        }

        ApiResponse.success(res, null, 'Student deactivated successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = { getStudents, getStudent, getMyProfile, updateStudent, uploadDocument, updateStudentProfile, createStudentProfile, deleteStudent };
