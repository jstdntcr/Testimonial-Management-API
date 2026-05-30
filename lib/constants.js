// user model
const userRoles = ["owner", "staff"];

// testimonial model
const testimonialStatus = ["draft", "recording", "processing", "completed", "shared"];

// testimonialSettings model
const defaultVideoLength = 10;
const videoLengthOptions = [5, 10, 15, 20, 25];
const questionnaire = ["What do you like about our service?"];
const sendingOptions = ["email", "sms"];
const thankYouMessage = "Thank you!";
const contactConsentText = "Join our mailing list";


module.exports = {
    userRoles, testimonialStatus, defaultVideoLength,
    videoLengthOptions, questionnaire, sendingOptions,
    thankYouMessage, contactConsentText
};