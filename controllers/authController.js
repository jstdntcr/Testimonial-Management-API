const User = require('../models/user');
const utils = require('../lib/utils');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
    try {
        const { email, password, businessName, role, isActive } = req.body;

        const existing = await User.findOne({email: email});
        if (existing) {
            res.status(409).json({code: 409, status: "failure", message: "Email already exists"});
        }

        const emailResult = utils.validateEmail(email);
        const passwordResult = utils.validatePassword(password);
        const businessNameResult = utils.validateBusinessName(businessName);

        const errors = {
            ...(emailResult.valid ? {} : { email: emailResult.errors }),
            ...(passwordResult.valid ? {} : { password: passwordResult.errors }),
            ...(businessNameResult.valid ? {} : { businessName: businessNameResult.errors }),
        };

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ code: 400, status: 'failure', errors });
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

        const {password: _, ...safeUser} = user.toObject();

        res.json({ code: 201, status: 'success', data: safeUser });
    } catch (err) {
        console.log(err);
        res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email: email});

        if (!user) {
            return res.status(401).json({ code: 401, status: 'failure', message: 'Invalid Credentials' });
        }

        const isValid = await utils.comparePasswords(password, user.password);

        if (isValid) {
            const token = jwt.sign(
                {userId: user.id, email: user.email},
                process.env.JWT_SECRET,
                {expiresIn: process.env.JWT_EXPIRY},
            )

            const {password, ...safeUser} = user.toObject();

            res.status(201).json({code: 201, status: 'success',
                data: {userId: safeUser.userId, email: safeUser.email, token}});
        } else {
            res.status(401).json({code: 401, status: 'failure', message: 'Invalid Credentials'});
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

module.exports = {registerUser, loginUser};