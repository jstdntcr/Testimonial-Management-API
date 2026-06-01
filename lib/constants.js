// user model
const userRoles = ['owner', 'staff'];

// testimonial model
const testimonialStatus = ['draft', 'recording', 'processing', 'completed', 'shared'];

// testimonialSettings model
const defaultVideoLength = 10;
const videoLengthOptions = [5, 10, 15, 20, 25];
const questionnaire = ['What do you like about our service?'];
const sendingOptions = ['email', 'sms'];
const thankYouMessage = 'Thank you!';
const contactConsentText = 'Join our mailing list';
const channels = ['email', 'sms', 'facebook', 'instagram'];

// hashing
const saltRounds = 10;

// testimonials endpoints
const page = 1;
const limit = 10;
const sortingField = 'createdAt';

module.exports = {
    userRoles, testimonialStatus, defaultVideoLength,
    videoLengthOptions, questionnaire, sendingOptions,
    thankYouMessage, contactConsentText, saltRounds,
    page, limit, sortingField, channels
};