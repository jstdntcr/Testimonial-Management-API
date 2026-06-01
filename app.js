require('dotenv').config();

const mongoose = require('mongoose');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const userRoute = require('./routes/authRoute');
const testimonialRoute = require('./routes/testimonialRoute');

app.use(express.json());
app.use('/api/auth', userRoute);
app.use('/api/testimonials', testimonialRoute);

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

if (require.main === module) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('MongoDB connected');
            app.listen(port, () => console.log(`Listening http://localhost:${port}`));
        })
        .catch(err => console.error('MongoDB error:', err));
}

module.exports = app;