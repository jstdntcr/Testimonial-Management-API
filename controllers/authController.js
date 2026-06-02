const User = require('../models/user');
const utils = require('../lib/utils');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { email, password, businessName, role, isActive } = req.body;

        const emailResult = utils.validateEmail(email);
        const passwordResult = utils.validatePassword(password);
        const businessNameResult = utils.validateName(businessName);

        const errors = {
            ...(emailResult.valid ? {} : { email: emailResult.errors }),
            ...(passwordResult.valid ? {} : { password: passwordResult.errors }),
            ...(businessNameResult.valid ? {} : { businessName: businessNameResult.errors }),
        };

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ code: 400, status: 'failure', message: `Error occurred: ${JSON.stringify(errors)}` });
        }

        const existing = await User.findOne({email: email});
        if (existing) {
            return res.status(400).json({code: 400, status: 'failure', message: 'Email already exists'});
        }

        const lastUser = await User.findOne().sort({ userId: -1 });
        const newUserId = lastUser ? lastUser.userId + 1 : 1;

        const user = await User.create({
            userId: newUserId,
            email,
            password: await utils.hashPassword(password),
            businessName,
            role,
            isActive,
        });

        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        const {password: _, ...safeUser} = user.toObject();

        return res.status(201).json({ code: 201, status: 'success', message: 'User registered successfully' ,
            data: {...safeUser, token} });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        const emailResult = utils.validateEmail(email);

        const errors = {
            ...(emailResult.valid ? {} : { email: emailResult.errors }),
            ...(typeof password === 'string' && password.length > 0 ? {} : { password: ['Password is required'] }),
        };

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ code: 400, status: 'failure', message: `Error occurred: ${JSON.stringify(errors)}` });
        }

        const user = await User.findOne({email: email});

        if (!user) {
            return res.status(401).json({ code: 401, status: 'failure', message: 'Invalid Credentials' });
        }

        const isValid = await utils.comparePasswords(password, user.password);

        if (isValid) {
            const token = jwt.sign(
                {userId: user.userId, email: user.email},
                process.env.JWT_SECRET,
                {expiresIn: process.env.JWT_EXPIRY},
            );

            const {password: _password, ...safeUser} = user.toObject();

            return res.status(200).json({code: 200, status: 'success', message: 'Login successfully',
                data: {userId: safeUser.userId, email: safeUser.email, token}});
        } else {
            return res.status(401).json({code: 401, status: 'failure', message: 'Invalid Credentials'});
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
};

module.exports = {registerUser, loginUser};