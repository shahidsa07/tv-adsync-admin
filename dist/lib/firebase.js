"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.app = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const dotenv_1 = require("dotenv");
// Load environment variables from .env file
(0, dotenv_1.config)();
// This is the recommended pattern for initializing firebase-admin in a serverless environment.
// It ensures that we don't try to initialize the app more than once.
let app;
let db;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The private key must be parsed correctly to handle newline characters.
const privateKey = (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n');
if (projectId && clientEmail && privateKey) {
    if ((0, app_1.getApps)().length === 0) {
        try {
            exports.app = app = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            exports.db = db = (0, firestore_1.getFirestore)(app);
            console.log('Firebase Admin SDK initialized successfully.');
        }
        catch (error) {
            console.error('Firebase Admin initialization error:', error.message);
            // @ts-ignore
            exports.db = db = undefined;
        }
    }
    else {
        exports.app = app = (0, app_1.getApps)()[0];
        exports.db = db = (0, firestore_1.getFirestore)(app);
    }
}
else {
    console.warn('Firebase credentials are not set in .env file. Database operations will not be available.');
    // @ts-ignore
    exports.db = db = undefined;
}
