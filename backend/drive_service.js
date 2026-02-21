const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const KEY_PATH = path.join(__dirname, 'google-credentials.json');
const GOOGLE_DRIVE_ENABLED = process.env.GOOGLE_DRIVE_ENABLED === 'true' && fs.existsSync(KEY_PATH);

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let drive;

async function authenticate() {
    if (!GOOGLE_DRIVE_ENABLED) return null;
    if (drive) return drive;

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_PATH,
            scopes: SCOPES,
        });
        const client = await auth.getClient();
        drive = google.drive({ version: 'v3', auth: client });
        console.log('✅ Google Drive authenticated');
        return drive;
    } catch (error) {
        console.error('❌ Failed to authenticate Google Drive:', error);
        return null;
    }
}

async function uploadFile(fileBuffer, fileName, mimeType, folderId) {
    // 1. Generate Local ID and Save locally (Primary Storage)
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension).replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileId = `file_${Date.now()}_${baseName}${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileId);
    fs.writeFileSync(filePath, fileBuffer);
    console.log('✅ File saved to local storage:', fileId);

    // 2. Optional: Mirror to Google Drive if enabled
    if (GOOGLE_DRIVE_ENABLED) {
        const driveInstance = await authenticate();
        if (driveInstance) {
            const fileMetadata = {
                name: fileName,
                parents: folderId ? [folderId] : []
            };
            const media = {
                mimeType: mimeType,
                body: require('stream').Readable.from(fileBuffer)
            };
            try {
                const response = await driveInstance.files.create({
                    resource: fileMetadata, media, fields: 'id'
                });
                console.log('🚀 Mirror copy uploaded to Google Drive:', response.data.id);
            } catch (error) {
                console.warn('⚠️ Mirror to Drive failed (continuing with local only):', error.message);
            }
        }
    }

    return fileId;
}

async function downloadFile(fileId) {
    // 1. Always check Local first (Primary)
    const filePath = path.join(UPLOADS_DIR, fileId);
    if (fs.existsSync(filePath)) {
        console.log('⚡ Retrieving from local storage:', fileId);
        return fs.readFileSync(filePath);
    }

    // 2. Drive Fallback (only if enabled)
    if (GOOGLE_DRIVE_ENABLED) {
        const driveInstance = await authenticate();
        if (driveInstance) {
            try {
                console.log('☁️ Retrieving from Google Drive fallback:', fileId);
                const response = await driveInstance.files.get({
                    fileId: fileId, alt: 'media'
                }, { responseType: 'arraybuffer' });
                return Buffer.from(response.data);
            } catch (error) {
                console.error('Drive fallback retrieval failed:', error);
            }
        }
    }

    throw new Error('File not found in local storage');
}

async function deleteFile(fileId) {
    if (fileId.startsWith('local_')) {
        const filePath = path.join(UPLOADS_DIR, fileId);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('✅ Local file deleted:', fileId);
        }
        return;
    }

    const driveInstance = await authenticate();
    if (!driveInstance) return;

    try {
        await driveInstance.files.delete({ fileId: fileId });
        console.log('✅ Google Drive file deleted:', fileId);
    } catch (error) {
        console.error('Drive delete error:', error);
    }
}

module.exports = {
    uploadFile,
    downloadFile,
    deleteFile
};
