const bcrypt = require('bcryptjs');
const constants = require('./constants');

const validateEmail = (email) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const valid = pattern.test(email);
    return {
        valid,
        errors: valid ? [] : ["Некорректный email"],
    };
};

const validatePassword = (password) => {
    const rules = [
        {
            test: (p) => typeof p === "string" && p.length >= 8,
            message: "Минимум 8 символов",
        },
        {
            test: (p) => /[A-Z]/.test(p),
            message: "Минимум одна заглавная буква",
        },
        {
            test: (p) => /[a-z]/.test(p),
            message: "Минимум одна строчная буква",
        },
        {
            test: (p) => /\d/.test(p),
            message: "Минимум одна цифра",
        },
        {
            test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
            message: "Минимум один специальный символ",
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
            test: (n) => typeof n === "string" && n.trim().length > 0,
            message: "Название не может быть пустым",
        },
        {
            test: (n) => n.trim().length >= 2,
            message: "Минимум 2 символа",
        },
        {
            test: (n) => n.trim().length <= 100,
            message: "Максимум 100 символов",
        },
        {
            test: (n) => /^[\p{L}\p{N}\s\-&'.,()]+$/u.test(n.trim()),
            message: "Недопустимые символы",
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

const hashPassword = async (password) => {
    const saltRounds = constants.saltRounds;
    return await bcrypt.hash(password, saltRounds);
}

const comparePasswords = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}

module.exports = {
    validateEmail, validatePassword, validateName, hashPassword, comparePasswords,
}