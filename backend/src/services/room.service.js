const Student = require('../models/Student');
const Cot = require('../models/Cot');
const Room = require('../models/Room');
const ApiError = require('../utils/ApiError');

/**
 * Allocate a student to a specific cot.
 * Validates capacity and prevents double allocation.
 */
const allocateStudent = async (studentId, cotId) => {
    const cot = await Cot.findById(cotId).populate('roomId');
    if (!cot) throw ApiError.notFound('Cot');
    if (cot.isOccupied) throw ApiError.conflict('Cot is already occupied');

    const student = await Student.findById(studentId);
    if (!student) throw ApiError.notFound('Student');
    if (student.verificationStatus !== 'approved') {
        throw ApiError.badRequest('Student must be approved before room allocation');
    }
    if (student.cotId) throw ApiError.conflict('Student is already allocated to a cot');

    // Allocate
    cot.studentId = studentId;
    cot.isOccupied = true;
    cot.allocatedAt = new Date();
    await cot.save();

    student.cotId = cotId;
    await student.save();

    return { student, cot };
};

/**
 * Deallocate a student from their cot.
 */
const deallocateStudent = async (studentId) => {
    const student = await Student.findById(studentId);
    if (!student) throw ApiError.notFound('Student');
    if (!student.cotId) throw ApiError.badRequest('Student is not allocated to any cot');

    const cot = await Cot.findById(student.cotId);
    if (cot) {
        cot.studentId = null;
        cot.isOccupied = false;
        cot.allocatedAt = null;
        await cot.save();
    }

    student.cotId = null;
    await student.save();

    return student;
};

/**
 * Get room occupancy statistics.
 */
const getRoomStats = async (roomId) => {
    const room = await Room.findById(roomId);
    if (!room) throw ApiError.notFound('Room');

    const total = await Cot.countDocuments({ roomId });
    const occupied = await Cot.countDocuments({ roomId, isOccupied: true });
    return { total, occupied, available: total - occupied };
};

module.exports = { allocateStudent, deallocateStudent, getRoomStats };
