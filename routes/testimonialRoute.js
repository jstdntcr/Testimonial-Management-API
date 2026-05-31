const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const testimonialController = require('../controllers/testimonialController');

router.use(authMiddleware);

module.exports = router;
