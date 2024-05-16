'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const AuthSingleton = require('./authSingleton');

class UploadHandler {
    constructor(auth) {
        this.auth = auth;
        this.youtube = google.youtube({ version: 'v3', auth });
    }

    async uploadFile(filePath, vidTitle, vidDescription) {
        const fileSize = fs.statSync(filePath).size;
        console.log(`Uploading file: ${filePath}, Title: ${vidTitle}, Description: ${vidDescription}, Size: ${fileSize}`);
        const res = await this.youtube.videos.insert(
            {
                part: 'id,snippet,status',
                notifySubscribers: false,
                requestBody: {
                    snippet: {
                        title: vidTitle,
                        description: vidDescription,
                    },
                    status: {
                        privacyStatus: 'private',
                    },
                },
                media: {
                    body: fs.createReadStream(filePath),
                },
            },
            {
                onUploadProgress: evt => {
                    const progress = (evt.bytesRead / fileSize) * 100;
                    readline.clearLine(process.stdout, 0);
                    readline.cursorTo(process.stdout, 0, null);
                    process.stdout.write(`${Math.round(progress)}% complete`);
                },
            }
        );
        console.log('\n\n');
        console.log(res.data);
        const videoId = res.data.id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`Video uploaded successfully! URL: ${videoUrl}`);
        return res.data;
    }

    async uploadFiles(paths, titles, descriptions) {
        for (let i = 0; i < paths.length; i++) {
            try {
                const filePath = paths[i];
                const title = titles[i];
                const description = descriptions[i];
                await this.uploadFile(filePath, title, description).catch(console.error);
            } catch (error) {
                console.error(`Error uploading ${paths[i]}: ${error.message}`);
            }
        }
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// API endpoint to handle file uploads from frontend
router.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        console.log('Received upload request');
        console.log('Files:', req.files);
        console.log('Descriptions:', req.body.descriptions);

        const auth = await AuthSingleton.getInstance().authenticate();
        const uploadHandler = new UploadHandler(auth);
        const paths = req.files.map(file => file.path);
        const descriptions = req.body.descriptions.split(',');
        const titles = paths.map(getTitleFromPath);

        console.log('Paths:', paths);
        console.log('Titles:', titles);
        console.log('Descriptions:', descriptions);

        await uploadHandler.uploadFiles(paths, titles, descriptions);
        res.send('Files uploaded and processed successfully');
    } catch (error) {
        console.error('Error in upload endpoint:', error.message);
        res.status(500).send('Error uploading files');
    }
});

function getTitleFromPath(filePath) {
    const baseName = path.basename(filePath);
    return path.parse(baseName).name;
}

module.exports = router;
