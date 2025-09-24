import {getApps, initializeApp, cert, App} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';

// This is the recommended pattern for initializing firebase-admin in a serverless environment.
// It ensures that we don't try to initialize the app more than once.

let app: App;
let db: Firestore;

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
      db = getFirestore(app);
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      console.error('Firebase Admin initialization error:', error.message);
      // @ts-ignore
      db = undefined;
    }
  } else {
    app = getApps()[0];
    db = getFirestore(app);
  }
} else {
  console.warn(
    'Firebase credentials are not set in .env file. Database operations will not be available.'
  );
  // @ts-ignore
  db = undefined;
}

export {app, db};