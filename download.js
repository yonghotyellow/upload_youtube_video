// Copyright 2016 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const { google } = require('googleapis');
const fs = require('fs');
const os = require('os');
const uuid = require('uuid');
const path = require('path');
const readline = require('readline');
const { authenticate } = require('@google-cloud/local-auth');
const { error } = require('console');

const drive = google.drive('v3');
const youtube = google.youtube('v3');

async function downloadFile(fileId) {
    // For converting document formats, and for downloading template
    // documents, see the method drive.files.export():
    // https://developers.google.com/drive/api/v3/manage-downloads
    return drive.files
        .get({ fileId, fields: 'name' })
        .then(res => {
            const filename = res.data.name;
            const extension = path.extname(filename).toLowerCase();
            if (extension != '.mp4') {
                console.log(`Skipping file: ${fileId} (not MP4)`);
                return; // Skip download if not MP4
            }
            return drive.files
                .get({ fileId, alt: 'media' }, { responseType: 'stream' })
                .then(res => {
                    return new Promise((resolve, reject) => {
                        const filePath = path.join(__dirname, './video', `${filename}`);
                        console.log(`writing to ${filePath}`);
                        const dest = fs.createWriteStream(filePath);
                        let progress = 0;

                        res.data
                            .on('end', () => {
                                console.log('Done downloading file.');
                                resolve(filePath);
                            })
                            .on('error', err => {
                                console.error('Error downloading file.');
                                reject(err);
                            })
                            .on('data', d => {
                                progress += d.length;
                                const progressInMB = (progress / (1024 * 1024)).toFixed(2);

                                process.stdout.write(`Downloaded ${progressInMB} MB\r`);
                            })
                            .pipe(dest);
                    });
                })

        });
}

async function uploadFile(filePath, vidTitle, vidDescription) {
    const fileSize = fs.statSync(filePath).size;
    const res = await youtube.videos.insert(
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
            // Use the `onUploadProgress` event from Axios to track the
            // number of bytes uploaded to this point.
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
    const videoId = res.data.id
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Video uploaded successfully! URL: ${videoUrl}`);
    return res.data;
}

function getFileIdFromUrl(url) {
    const urlParts = url.split('/');
    // Identify the segment containing the file ID based on its position
    const fileIdSegmentIndex = urlParts.findIndex(segment => segment === 'd');
    if (fileIdSegmentIndex !== -1) {
        console.log('fileID: ', urlParts[fileIdSegmentIndex + 1]);
        return urlParts[fileIdSegmentIndex + 1];
    } else {
        console.error('Invalid Google Drive file URL format.');
        return null; // Indicate error or provide a default value
    }
}

async function getAuth() {
    try {
        const auth = await authenticate({
            keyfilePath: path.join(__dirname, './client_secret.json'),
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/drive.appdata',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.metadata',
                'https://www.googleapis.com/auth/drive.metadata.readonly',
                'https://www.googleapis.com/auth/drive.photos.readonly',
                'https://www.googleapis.com/auth/drive.readonly',
                'https://www.googleapis.com/auth/youtube.upload',
                'https://www.googleapis.com/auth/youtube'
            ],
        });
        return auth;
    } catch (error) {
        console.error('Error during authentication:', error.message);
        // Exit the script if authentication fails
        process.exit(1);
    }
}


async function downloadAndUploadFiles(urls, titles, descriptions) {
    const auth = await getAuth();
    google.options({ auth });
    const fileIds = [];
    for (const fileUrl of urls) {
        const extractedFileId = getFileIdFromUrl(fileUrl);
        if (extractedFileId) {
            fileIds.push(extractedFileId);
        }
    }
    for (let i = 0; i < fileIds.length; i++) {
        try {
            const fileId = fileIds[i];
            const title = titles[i];
            const description = descriptions[i];

            // Download the video (using your provided downloadFile function)
            const filePath = await downloadFile(fileId);
            // Check if the file was downloaded successfully
            if (!filePath) {
                console.warn(`Skipped upload for fileId: ${fileId}`);
                continue; // Skip upload if download failed
            }

            // Upload the downloaded video (using your provided uploadFile function)
            await uploadFile(filePath, title, description).catch(console.error);

        } catch (error) {
            console.error(`Error uploading ${fileIds[i]}: ${error.message}`);
        }
    }
}

if (module === require.main) {
    if (process.argv.length % 3 !== 2) {
        console.error('Usage: node download.js <url1> <title1> <description1> <url2> <title2> <description2> ...');
        process.exit(1); // Exit with an error code
    }
    const fileIds = [];
    const titles = [];
    const descriptions = [];
    for (let i = 2; i < process.argv.length; i += 3) {
        fileIds.push(process.argv[i]);
        titles.push(process.argv[i + 1]);
        descriptions.push(process.argv[i + 2]);
    }

    downloadAndUploadFiles(fileIds, titles, descriptions)
        .catch(error => {
            console.error(error.message);
        });
}
module.exports = downloadAndUploadFiles;