const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const testimonialController = require('../controllers/testimonialController');

router.use(authMiddleware);

router.post('/', testimonialController.createTestimonial);
router.get('/', testimonialController.getTestimonials);
router.get('/:testimonialId', testimonialController.getTestimonialById);
router.put('/:testimonialId', testimonialController.updateTestimonialById);
router.patch('/:testimonialId/status', testimonialController.testimonialTransition);
router.delete('/:testimonialId', testimonialController.deleteTestimonial);
router.post('/:testimonialId/share', testimonialController.shareTestimonial);
router.get('/settings', testimonialController.getTestimonialSettings);
router.post('/settings', testimonialController.createTestimonialSettings)

module.exports = router;
