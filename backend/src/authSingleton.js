const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');

class AuthSingleton {
    constructor() {
        this.auth = null;
    }

    async authenticate() {
        if (!this.auth) {
            try {
                this.auth = await authenticate({
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
            } catch (error) {
                console.error('Error during authentication:', error.message);
                process.exit(1);
            }
        }
        return this.auth;
    }

    static getInstance() {
        if (!AuthSingleton.instance) {
            AuthSingleton.instance = new AuthSingleton();
        }
        return AuthSingleton.instance;
    }
}

module.exports = AuthSingleton;
