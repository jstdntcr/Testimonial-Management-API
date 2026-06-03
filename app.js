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

// 404 — неизвестный маршрут, единый JSON-формат
app.use((_req, res) => {
    res.status(404).json({ code: 404, status: 'failure', message: 'Route not found' });
});

// Глобальный обработчик ошибок (битый JSON, непойманные исключения)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ code: 400, status: 'failure', message: 'Invalid JSON body' });
    }
    return res.status(500).json({ code: 500, status: 'failure', message: 'Server error' });
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