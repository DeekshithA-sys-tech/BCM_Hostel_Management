const Joi = require('joi');

const register = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
        .messages({ 'string.pattern.base': 'Password must have uppercase, lowercase and number' }),
    name: Joi.string().min(2).max(100).required(),
    sspId: Joi.string().alphanum().min(4).max(20).required()
});

const login = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

module.exports = { register, login };
