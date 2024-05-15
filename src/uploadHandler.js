'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

class UploadHandler {
    constructor(auth) {
        this.auth = auth;
        this.youtube = google.youtube({ version: 'v3', auth });
    }

    async uploadFile(filePath, vidTitle, vidDescription) {
        const fileSize = fs.statSync(filePath).size;
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

module.exports = UploadHandler;
