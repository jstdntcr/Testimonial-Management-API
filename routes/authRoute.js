const express = require('express');
const router = express.Router();
const userController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        code: 429,
        status: 'failure',
        message: 'Too many logins attempts'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/register', loginLimiter, userController.registerUser);
router.post('/login', loginLimiter, userController.loginUser);

module.exports = router;
