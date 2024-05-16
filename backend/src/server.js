const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadHandler = require('./uploadHandler');
const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Use the upload handler for file uploads
app.use('/api', uploadHandler);

// The "catchall" handler: for any request that doesn't match the above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});
