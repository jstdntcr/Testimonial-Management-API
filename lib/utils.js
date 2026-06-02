const bcrypt = require('bcryptjs');
const constants = require('./constants');

const validateEmail = (email) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = pattern.test(email);
    return {
        valid,
        errors: valid ? [] : ['Invalid email format'],
    };
};

const validatePassword = (password) => {
    const rules = [
        {
            test: (p) => typeof p === 'string' && p.length >= 8,
            message: 'Minimum 8 characters',
        },
        {
            test: (p) => /[A-Z]/.test(p),
            message: 'At least one uppercase letter',
        },
        {
            test: (p) => /[a-z]/.test(p),
            message: 'At least one lowercase letter',
        },
        {
            test: (p) => /\d/.test(p),
            message: 'At least one digit',
        },
        {
            test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
            message: 'At least one special character',
        },
    ];

    const errors = rules
        .filter((rule) => !rule.test(password))
        .map((rule) => rule.message);

    return {
        valid: errors.length === 0,
        errors,
    };
};

const validateName = (name) => {
    const rules = [
        {
            test: (n) => typeof n === 'string' && n.trim().length > 0,
            message: 'Name cannot be empty',
        },
        {
            test: (n) => n.trim().length >= 2,
            message: 'Minimum 2 characters',
        },
        {
            test: (n) => n.trim().length <= 100,
            message: 'Maximum 100 characters',
        },
        {
            test: (n) => /^[\p{L}\p{N}\s\-&'.,()]+$/u.test(n.trim()),
            message: 'Invalid characters',
        },
    ];

    const errors = rules
        .filter((rule) => !rule.test(name))
        .map((rule) => rule.message);

    return {
        valid: errors.length === 0,
        errors,
    };
};

const validateChannels = (channels) => {
    if (!Array.isArray(channels)) {
        return { valid: false, errors: ['must be an array'] };
    }
    const invalid = channels.filter((c) => !constants.channels.includes(c));
    if (invalid.length > 0) {
        return { valid: false, errors: [`Invalid channels: ${invalid.join(', ')}`] };
    }
    return { valid: true, errors: [] };
};

const validateSettings = (body) => {
    const errors = {};
    const { isEnabled, defaultVideoLength, videoLengthOptions,
        questionnaire, sendingOptions, thankYouMessage, contactConsent } = body;

    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
        errors.isEnabled = 'must be a boolean';
    }
    if (defaultVideoLength !== undefined &&
        (typeof defaultVideoLength !== 'number' || defaultVideoLength <= 0)) {
        errors.defaultVideoLength = 'must be a positive number';
    }
    if (videoLengthOptions !== undefined &&
        (!Array.isArray(videoLengthOptions) || !videoLengthOptions.every((n) => typeof n === 'number'))) {
        errors.videoLengthOptions = 'must be an array of numbers';
    }
    if (questionnaire !== undefined &&
        (!Array.isArray(questionnaire) || !questionnaire.every((s) => typeof s === 'string'))) {
        errors.questionnaire = 'must be an array of strings';
    }
    if (sendingOptions !== undefined) {
        if (!Array.isArray(sendingOptions) || !sendingOptions.every((s) => typeof s === 'string')) {
            errors.sendingOptions = 'must be an array of strings';
        } else {
            const invalid = sendingOptions.filter((c) => !constants.channels.includes(c));
            if (invalid.length > 0) errors.sendingOptions = `invalid values: ${invalid.join(', ')}`;
        }
    }
    if (thankYouMessage !== undefined && typeof thankYouMessage !== 'string') {
        errors.thankYouMessage = 'must be a string';
    }
    if (contactConsent !== undefined &&
        (typeof contactConsent !== 'object' || contactConsent === null || Array.isArray(contactConsent))) {
        errors.contactConsent = 'must be an object';
    }

    return { valid: Object.keys(errors).length === 0, errors };
};

const hashPassword = async (password) => {
    const saltRounds = constants.saltRounds;
    return await bcrypt.hash(password, saltRounds);
};

const comparePasswords = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = {
    validateEmail, validatePassword, validateName,
    validateChannels, validateSettings,
    hashPassword, comparePasswords,
};