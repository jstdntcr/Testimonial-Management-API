require('dotenv').config();

const port = process.env.PORT || 3000;

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

const express = require('express');
const app = express();

app.use(express.json());

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(port, () => console.log(`Listening http://localhost:${port}`));