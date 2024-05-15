'use strict';

const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');

const drive = google.drive('v3');
const youtube = google.youtube('v3');

const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.photos.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube'
];

class UploadError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UploadError';
    }
}

async function uploadFile(auth, filePath, vidTitle, vidDescription) {
    const fileSize = fs.statSync(filePath).size;
    const res = await youtube.videos.insert(
        // ...
    );
    // ...
    return res.data;
}

async function getAuth() {
    try {
        const auth = await authenticate({
            keyfilePath: path.join(__dirname, './client_secret.json'),
            scopes: SCOPES,
        });
        return auth;
    } catch (error) {
        throw new UploadError('Error during authentication: ' + error.message);
    }
}

async function uploadFiles(auth, paths, titles, descriptions) {
    const promises = paths.map((path, i) => {
        return uploadFile(auth, path, titles[i], descriptions[i]).catch(error => {
            console.error(`Error uploading ${path}: ${error.message}`);
        });
    });
    return Promise.all(promises);
}

async function UploadAllFiles(paths, titles, descriptions) {
    const auth = await getAuth();
    google.options({ auth });
    return uploadFiles(auth, paths, titles, descriptions);
}

// ...

module.exports = UploadAllFiles;