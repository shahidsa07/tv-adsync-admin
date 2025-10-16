import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config(); // Load environment variables from .env file

let app: App | undefined;
let db: Firestore | undefined;

function initializeFirebaseAdmin() {
  if (app) {
    return; // Already initialized
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key must be parsed correctly to handle newline characters.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    if (getApps().length === 0) {
      try {
        app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('Firebase Admin SDK initialized successfully.');
      } catch (error: any) {
        console.error('Firebase Admin initialization error:', error.message);
      }
    } else {
      app = getApps()[0];
    }
  } else {
    console.warn(
      'Firebase credentials are not set in .env file. Database operations will not be available.'
    );
  }
}

function getDb(): Firestore {
  if (!app) {
    initializeFirebaseAdmin();
  }
  if (!db) {
    if (app) {
      db = getFirestore(app);
    } else {
      // This will throw an error in functions that try to use it without proper setup.
      throw new Error("Firestore is not initialized. Check your Firebase credentials.");
    }
  }
  return db;
}

export { getDb };
