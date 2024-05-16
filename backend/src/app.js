// src/server.js
'use strict';

const { google } = require('googleapis');
const path = require('path');
const AuthSingleton = require('./authSingleton');
const UploadHandler = require('./uploadHandler');

function getTitleFromPath(filePath) {
    const baseName = path.basename(filePath);
    return path.parse(baseName).name;
}

async function UploadAllFiles(paths, descriptions) {
    try {
        const auth = await AuthSingleton.getInstance().authenticate();
        google.options({ auth });
        const uploadHandler = new UploadHandler(auth);
        const titles = paths.map(getTitleFromPath);
        await uploadHandler.uploadFiles(paths, titles, descriptions);
    } catch (error) {
        console.error(error.message);
    }
}

async function getInputs() {
    const inquirer = await import('inquirer');

    const inputs = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'paths',
            message: 'Enter file paths (separated by comma):',
        },
        {
            type: 'input',
            name: 'descriptions',
            message: 'Enter file descriptions (separated by comma):',
        },
    ]);

    const paths = inputs.paths.split(',').map(filePath => filePath.trim().replace(/^'(.*)'$/, '$1'));
    const descriptions = inputs.descriptions.split(',');

    if (paths.length !== descriptions.length) {
        console.error('The number of paths and descriptions must be the same.');
        process.exit(1);
    }

    return { paths, descriptions };
}

if (module === require.main) {
    getInputs()
        .then(({ paths, descriptions }) => {
            UploadAllFiles(paths, descriptions)
                .catch(error => {
                    console.error(error.message);
                });
        });
}

module.exports = UploadAllFiles;