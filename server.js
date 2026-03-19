// Import necessary modules
const express = require('express');
const app = express();

// Handling for /api/gemini-proxy route
app.use('/api/gemini-proxy', (req, res, next) => {
    // Your handling logic here
    res.send('Gemini Proxy Route');
});

// Serve static files after the API routes
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});