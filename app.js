require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const userRoute = require('./routes/authRoute');

app.use(express.json());
app.use("/api/auth", userRoute);
app.use("/api/testimonials")

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(port, () => console.log(`Listening http://localhost:${port}`));