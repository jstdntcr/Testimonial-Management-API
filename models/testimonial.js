const mongoose = require('mongoose');
const constants = require("../lib/constants");
const { v4: uuidv4 } = require('uuid');

const testimonialSchema = new mongoose.Schema(
    {
        testimonialId: {type: String, unique: true, default: uuidv4},
        userId: {type: Number, required: true},
        customerName: {type: String, required: true},
        customerEmail: {type: String, required: false},
        customerPhone: {type: String, required: false},
        videoUrl: {type: String, required: false},
        rating: {type: Number, required: false, min: 1, max: 5},
        text: {type: String, required: false},
        status: {type: String, required: true, enum: constants.testimonialStatus,  default: constants.testimonialStatus[0]},
        consentGiven: {type: Boolean, required: false, default: false},
        sharedAt: {type: Date, required: false},
        sharedChannels: {type: [String], required: false},
        isDeleted: {type: Boolean, required: false, default: false},
        deletedAt: {type: Date, required: false},
    },
    {timestamps: true}
);

testimonialSchema.index({testimonialId: 1});
testimonialSchema.index({userId: 1});
testimonialSchema.index({status: 1});
testimonialSchema.index({userId: 1, isDeleted: 1});

module.exports = mongoose.model('Testimonial', testimonialSchema);