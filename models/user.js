const mongoose = require('mongoose');
const constants = require('../lib/constants');

const userSchema = new mongoose.Schema(
    {
        userId: {type: Number, required: true, unique: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        businessName: {type: String, required: true},
        role: {type: String, enum: constants.userRoles, default: constants.userRoles[0]},
        isActive: {type: Boolean, default: true},
    },
    {timestamps: true}
);

module.exports = mongoose.model('User', userSchema);