const Staff = require('../models/Staff');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getStaff = async (req, res, next) => {
    try {
        const { role, isActive = true } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const staff = await Staff.find(filter).sort({ name: 1 });
        ApiResponse.success(res, { staff, count: staff.length });
    } catch (err) {
        next(err);
    }
};

const createStaff = async (req, res, next) => {
    try {
        const staff = await Staff.create(req.body);
        ApiResponse.created(res, { staff }, 'Staff created');
    } catch (err) {
        next(err);
    }
};

const updateStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!staff) throw ApiError.notFound('Staff');
        ApiResponse.success(res, { staff }, 'Staff updated');
    } catch (err) {
        next(err);
    }
};

const deleteStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, { isActive: false });
        if (!staff) throw ApiError.notFound('Staff');
        ApiResponse.success(res, null, 'Staff deactivated');
    } catch (err) {
        next(err);
    }
};

module.exports = { getStaff, createStaff, updateStaff, deleteStaff };
