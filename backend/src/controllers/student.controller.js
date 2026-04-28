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
            .populate('cotId');

        if (!student) throw ApiError.notFound('Student profile');

        ApiResponse.success(res, { student });
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
        // Convert the buffer to a base64 encoded data URI
        const fileData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const doc = await Document.findOneAndUpdate(
            { studentId: student._id, type },
            {
                fileData,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                isVerified: false
            },
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
        if (!student) throw ApiError.notFound('Student profile');

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
        if (sspId) updates.sspId = sspId;
        
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

        ApiResponse.success(res, { student, documents }, 'Profile and documents updated');
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

module.exports = { getStudents, getStudent, getMyProfile, updateStudent, uploadDocument, updateStudentProfile, deleteStudent };
