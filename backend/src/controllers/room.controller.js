const Room = require('../models/Room');
const Cot = require('../models/Cot');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const roomService = require('../services/room.service');
const { ROOM_DEFAULT_COTS } = require('../utils/constants');

const getRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find({ isActive: true })
            .populate({ path: 'cots', populate: { path: 'studentId', populate: { path: 'userId', select: 'name' } } })
            .sort({ floor: 1, roomNumber: 1 });

        // Add occupancy stats
        const enriched = rooms.map((room) => {
            const roomObj = room.toObject({ virtuals: true });
            const cots = roomObj.cots || [];
            roomObj.occupiedCount = cots.filter((c) => c.isOccupied).length;
            roomObj.availableCount = cots.length - roomObj.occupiedCount;
            return roomObj;
        });

        ApiResponse.success(res, { rooms: enriched, total: enriched.length });
    } catch (err) {
        next(err);
    }
};

const getRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate({ path: 'cots', populate: { path: 'studentId', populate: { path: 'userId', select: 'name email' } } });
        if (!room) throw ApiError.notFound('Room');
        ApiResponse.success(res, { room });
    } catch (err) {
        next(err);
    }
};

const createRoom = async (req, res, next) => {
    try {
        const { roomNumber, floor, block, totalCots, type, amenities } = req.body;

        const room = await Room.create({ roomNumber, floor, block, totalCots, type, amenities });

        // Auto-create cots
        const cotDocs = Array.from({ length: totalCots || ROOM_DEFAULT_COTS }, (_, i) => ({
            cotNumber: `C${String(i + 1).padStart(2, '0')}`,
            roomId: room._id
        }));
        await Cot.insertMany(cotDocs);

        ApiResponse.created(res, { room }, 'Room created with cots');
    } catch (err) {
        next(err);
    }
};

const updateRoom = async (req, res, next) => {
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!room) throw ApiError.notFound('Room');
        ApiResponse.success(res, { room }, 'Room updated');
    } catch (err) {
        next(err);
    }
};

const deleteRoom = async (req, res, next) => {
    try {
        const occupied = await Cot.countDocuments({ roomId: req.params.id, isOccupied: true });
        if (occupied > 0) throw ApiError.conflict('Cannot delete room with occupied cots');

        await Room.findByIdAndUpdate(req.params.id, { isActive: false });
        await Cot.deleteMany({ roomId: req.params.id });
        ApiResponse.success(res, null, 'Room deactivated');
    } catch (err) {
        next(err);
    }
};

const allocateStudent = async (req, res, next) => {
    try {
        const { studentId, cotId } = req.body;
        const result = await roomService.allocateStudent(studentId, cotId);
        ApiResponse.success(res, result, 'Student allocated to cot');
    } catch (err) {
        next(err);
    }
};

const deallocateStudent = async (req, res, next) => {
    try {
        const { studentId } = req.body;
        const student = await roomService.deallocateStudent(studentId);
        ApiResponse.success(res, { student }, 'Student removed from cot');
    } catch (err) {
        next(err);
    }
};

module.exports = { getRooms, getRoom, createRoom, updateRoom, deleteRoom, allocateStudent, deallocateStudent };
