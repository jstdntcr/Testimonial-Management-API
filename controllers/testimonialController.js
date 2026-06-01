const Testimonial = require('../models/Testimonial');
const TestimonialSettings = require('../models/TestimonialSettings');
const utils = require('../lib/utils');
const constants = require('../lib/constants');

const createTestimonial = async (req, res) => {
    try {
        const {customerName, customerEmail, customerPhone,
        videoUrl, rating, text, consentGiven, sharedChannels} = req.body;

        const customerEmailResult = customerEmail ? utils.validateEmail(customerEmail) : { valid: true };
        const customerNameResult = utils.validateName(customerName);

        const errors = {
            ...(customerEmailResult.valid ? {} : { customerEmail: customerEmailResult.errors }),
            ...(customerNameResult.valid ? {} : { customerName: customerNameResult.errors }),
            ...(rating >= 1 && rating <= 5 ? {} : {rating: 'Rating must be between 1 and 5'})
        };

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ code: 400, status: 'failure', message: `Error occurred: ${errors}` });
        }

        const testimonial = await Testimonial.create({
            userId: req.user.userId,
            customerName,
            customerEmail,
            customerPhone,
            videoUrl,
            rating,
            text,
            consentGiven,
            sharedChannels,
        });

        return res.json({ code: 201, status: 'success', data: testimonial.toObject() });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const getTestimonials = async (req, res) => {
    try {
        const filter = { userId: req.user.userId, isDeleted: false };

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const page = parseInt(req.query.page) || constants.page;
        const limit = parseInt(req.query.limit) || constants.limit;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || constants.sortingField;

        const total = await Testimonial.countDocuments(filter);
        const pages = Math.ceil(total / limit);
        const testimonials = await Testimonial.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ [sort]: -1 });

        const result = testimonials.map(testimonial => testimonial.toObject());

        return res.status(200).json({code: 200, status: 'success', message: 'Data retrieved successfully',
            data: result, pagination: {total, page, limit, pages}});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const getTestimonialById = async (req, res) => {
    try {
        const {testimonialId} = req.params;

        const testimonial = await Testimonial.findOne({
            testimonialId: testimonialId,
            userId: req.user.userId,
            isDeleted: false
        });

        if (!testimonial) {
            return res.status(404).json({ code: 404, status: 'failure', message: 'Testimonial not found' });
        }

        return res.status(200).json({code: 200, status: 'success', message: 'Data received successfully',
            data: testimonial.toObject()});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const updateTestimonialById = async (req, res) => {
    try {
        const {testimonialId} = req.params;
        const {customerName, customerEmail, customerPhone,
            videoUrl, rating, text, consentGiven, sharedChannels} = req.body;

        const customerEmailResult = customerEmail ? utils.validateEmail(customerEmail) : { valid: true };
        const customerNameResult = customerName ? utils.validateName(customerName) : { valid: true };

        const errors = {
            ...(customerEmailResult.valid ? {} : { customerEmail: customerEmailResult.errors }),
            ...(customerNameResult.valid ? {} : { customerName: customerNameResult.errors }),
        };

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ code: 400, status: 'failure', message: `Error occurred: ${errors}` });
        }

        const updates = {};
        if (customerName !== undefined) updates.customerName = customerName;
        if (customerEmail !== undefined) updates.customerEmail = customerEmail;
        if (customerPhone !== undefined) updates.customerPhone = customerPhone;
        if (videoUrl !== undefined) updates.videoUrl = videoUrl;
        if (rating !== undefined) updates.rating = rating;
        if (text !== undefined) updates.text = text;
        if (consentGiven !== undefined) updates.consentGiven = consentGiven;
        if (sharedChannels !== undefined) updates.sharedChannels = sharedChannels;

        const updatedTestimonial = await Testimonial.findOneAndUpdate(
            {testimonialId: testimonialId, userId: req.user.userId, isDeleted: false},
            { $set: updates },
            {new: true}
        );

        if (!updatedTestimonial) {
            return res.status(404).json({ code: 404, status: 'failure', message: 'Testimonial not found' });
        }

        return res.status(200).json({code: 200, status: 'success', message: 'Testimonial successfully updated',
            data: updatedTestimonial.toObject()});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const testimonialTransition = async (req, res) => {
    try {
        const {testimonialId} = req.params;
        const {testimonialStatus} = req.body;

        const testimonial = await Testimonial.findOne({
            testimonialId: testimonialId,
            userId: req.user.userId,
            isDeleted: false
        });

        if (!testimonial) {
            return res.status(404).json({ code: 404, status: 'failure', message: 'Testimonial not found' });
        }

        const currentStatus = testimonial.status;
        const currentStatusIndex = constants.testimonialStatus.indexOf(currentStatus);
        const newStatusIndex = constants.testimonialStatus.indexOf(testimonialStatus);

        if (newStatusIndex - currentStatusIndex !== 1 || currentStatusIndex === constants.testimonialStatus.length - 1) {
            return res.status(400).json({code: 400, status: 'failure',
                message: `Cannot transition from ${currentStatus} to ${testimonialStatus}`});
        }

        const updates = { status: testimonialStatus };

        if (testimonialStatus === 'shared') {
            updates.sharedAt = new Date();
        }

        const updatedTestimonial = await Testimonial.findOneAndUpdate(
            {testimonialId: testimonialId},
            { $set: updates},
            {new: true}
        );

        return res.status(200).json({ code: 200, status: 'success', message: 'Testimonial status successfully updated',
            data: updatedTestimonial.toObject() });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const deleteTestimonial = async (req, res) => {
    try {
        const {testimonialId} = req.params;

        const updates = {
            isDeleted: true,
            deletedAt: new Date()
        }

        const deletedTestimonial = await Testimonial.findOneAndUpdate({
            testimonialId: testimonialId,
            userId: req.user.userId,
            isDeleted: false
        },
            { $set: updates},
            {new: true}
        );

        if (!deletedTestimonial) {
            return res.status(404).json({ code: 404, status: 'failure', message: 'Testimonial not found' });
        }

        return res.status(200).json({code: 200, status: 'success', message: 'Testimonial deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const shareTestimonial = async (req, res) => {
    try {
        const {testimonialId} = req.params;
        const {channels} = req.body;

        const invalidChannels = channels.filter(channel => !constants.channels.includes(channel));
        if (invalidChannels.length > 0) {
            return res.status(400).json({ code: 400, status: 'failure',
                message: `Invalid channels: ${invalidChannels.join(', ')}`
            });
        }

        const testimonial = await Testimonial.findOne({
            testimonialId: testimonialId,
            userId: req.user.userId,
            isDeleted: false
        });

        if (!testimonial) {
            return res.status(404).json({ code: 404, status: 'failure', message: 'Testimonial not found' });
        }

        const resultChannels = new Set([...testimonial.sharedChannels, ...channels]);
        const updates = {
            sharedChannels: [...resultChannels],
            sharedAt: new Date()
        };

        if (testimonial.status === 'completed') {
            updates.status = 'shared';
        }

        const updatedTestimonial = await Testimonial.findOneAndUpdate(
            {testimonialId: testimonialId},
            { $set: updates},
            { new: true}
        );

        return res.status(200).json({ code: 200, status: 'success', message: "Testimonial successfully shared",
            data: updatedTestimonial.toObject() });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const getTestimonialSettings = async (req, res) => {
    try {
        const testimonialSettings = await TestimonialSettings.findOne({userId: req.user.userId});

        if (!testimonialSettings) {
            return res.status(200).json({code: 200, status: 'success',
                message: 'No testimonial settings for this user', data: null});
        }

        return res.status(200).json({code: 200, status: 'success', message: 'Testimonial settings retrieved successfully',
            data: testimonialSettings.toObject()});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const createTestimonialSettings = async (req, res) => {
    try {
        const { isEnabled, defaultVideoLength, videoLengthOptions,
            questionnaire, sendingOptions, thankYouMessage, contactConsent } = req.body;

        const updates = {};
        if (isEnabled !== undefined) updates.isEnabled = isEnabled;
        if (defaultVideoLength !== undefined) updates.defaultVideoLength = defaultVideoLength;
        if (videoLengthOptions !== undefined) updates.videoLengthOptions = videoLengthOptions;
        if (questionnaire !== undefined) updates.questionnaire = questionnaire;
        if (sendingOptions !== undefined) updates.sendingOptions = sendingOptions;
        if (thankYouMessage !== undefined) updates.thankYouMessage = thankYouMessage;
        if (contactConsent !== undefined) updates.contactConsent = contactConsent;

        const settings = await TestimonialSettings.findOneAndUpdate(
            { userId: req.user.userId },
            { $set: updates },
            { new: true, upsert: true }
        );

        return res.status(200).json({ code: 200, status: 'success', message: 'Testimonial settings successfully created',
            data: settings.toObject() });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const getAnalytics = async (req, res) => {
    try {
        const filter = {
            userId: req.user.userId,
            isDeleted: false
        }

        if (req.query.startDate) {
            filter.createdAt = {$gte: new Date(req.query.startDate)};
        }

        if (req.query.endDate) {
            filter.createdAt = {
                ...filter.createdAt,
                $lte: new Date(req.query.endDate)
            }
        }

        const totalTestimonials = await Testimonial.aggregate([
            { $match: filter},
            { $group: {_id: null, total: {$sum: 1}, avgRating: {$avg: '$rating'}}}
        ]);

        const testimonialsByStatus = await Testimonial.aggregate([
            {$match: filter},
            {$group: {_id: '$status', count: {$sum: 1}}}
        ]);
        const resultByStatus = {};
        testimonialsByStatus.forEach((testimonial) => {
            resultByStatus[testimonial._id] = testimonial.count
        });

        const result = {
            overview: {
                total: totalTestimonials[0].total || 0,
                byStatus: resultByStatus,
                averageRating: totalTestimonials[0].avgRating || 0,
            },
            period: {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            }
        };

        res.status(200).json({code: 200, status: 'success', message: 'Data retrieved successfully',
        data: result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const getTestimonialsWithFilters = async (req, res) => {
    try {
        const {search, createdAfter, createdBefore, minRating, maxRating} = req.query;

        const filter = {userId: req.user.id, isDeleted: false};

        if (search) filter.$or = [
            {customerName: {$regex: search, $options: 'i'}},
            {text: {$regex: search, $options: 'i'}},
        ];

        if (createdAfter || createdBefore) {
            filter.createdAt = {};
            if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
            if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
        }

        if (minRating || maxRating) {
            filter.rating = {};
            if (minRating) filter.rating.$gte = minRating;
            if (maxRating) filter.rating.$lte = maxRating;
        }

        const page = parseInt(req.query.page) || constants.page;
        const limit = parseInt(req.query.limit) || constants.limit;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || constants.sortingField;

        const total = await Testimonial.countDocuments(filter);
        const pages = Math.ceil(total / limit);
        const testimonials = await Testimonial.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ [sort]: -1 });

        const result = testimonials.map(testimonial => testimonial.toObject());

        return res.status(200).json({code: 200, status: 'success', message: 'Data retrieved successfully',
            data: result, pagination: {total, page, limit, pages}});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

const bulkTestimonialsTransition = async (req, res) => {
    try {
        const result = {
            updated: 0,
            failed: 0,
            errors: []
        };
        const testimonialStatus = req.body.status;
        const filteredTestimonialIds = req.body.testimonialIds.filter(
            testimonial => (testimonial.userId === req.user.id && !testimonial.isDeleted)
        );

        for (const itemId of filteredTestimonialIds) {
            const testimonial = await Testimonial.findOne({
                testimonialId: itemId
            });

            if (!testimonial) {
                result.failed++;
                result.errors.push(`Testimonial with id ${itemId} not found`);
                continue;
            }

            const currentStatus = testimonial.status;
            const currentStatusIndex = constants.testimonialStatus.indexOf(currentStatus);
            const newStatusIndex = constants.testimonialStatus.indexOf(testimonialStatus);

            if (newStatusIndex - currentStatusIndex !== 1 || currentStatusIndex === constants.testimonialStatus.length - 1) {
                result.failed++;
                result.errors.push(`Testimonial with id ${itemId} cannot transit from ${currentStatus} to ${testimonialStatus}`);
                continue;
            }

            const updates = { status: testimonialStatus };

            if (testimonialStatus === 'shared') {
                updates.sharedAt = new Date();
            }

            const updatedTestimonial = await Testimonial.findOneAndUpdate(
                {testimonialId: itemId},
                { $set: updates},
                {new: true}
            );

            result.updated++;
        };

        return res.status(200).json({code: 200, status: 'success', message: 'Data updated', data: result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
    }
}

module.exports = {createTestimonial, getTestimonials, getTestimonialById, updateTestimonialById, testimonialTransition,
    deleteTestimonial, shareTestimonial, getTestimonialSettings, createTestimonialSettings, getAnalytics,
    getTestimonialsWithFilters, bulkTestimonialsTransition};