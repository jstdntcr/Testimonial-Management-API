const mongoose = require('mongoose');
const constants = require('../lib/constants');

const testimonialSettingsSchema = new mongoose.Schema(
    {
        userId: {type: Number, required: true, unique: true},
        isEnabled: {type: Boolean, required: false, default: false},
        defaultVideoLength: {type: Number, required: false, default: constants.defaultVideoLength},
        videoLengthOptions: {type: [Number], required: false, default: constants.videoLengthOptions},
        questionnaire: {type: [String], required: false, default: constants.questionnaire},
        sendingOptions: {type: [String], required: false, default: constants.sendingOptions},
        thankYouMessage: {type: String, required: false, default: constants.thankYouMessage},
        contactConsent: {type: Object, required: false,
            default: {
                enabled: {type: Boolean, default: true},
                text: {type: String, default: constants.contactConsentText}
            }},
    },
    {timestamps: true}
);

module.exports = mongoose.model('TestimonialSettings', testimonialSettingsSchema);