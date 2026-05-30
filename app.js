require('dotenv').config();

const port = process.env.PORT || 3000;

const express = require('express');
const app = express();

app.use(express.json());

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(port, () => console.log(`Listening http://localhost:${port}`));