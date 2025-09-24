import {getApps, initializeApp, cert, App} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';

let app: App | undefined;
let db: Firestore | undefined;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Replace escaped newlines from environment variable
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  try {
    const credentials = {
      projectId,
      clientEmail,
      privateKey,
    };
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp({
        credential: cert(credentials),
        databaseURL: `https://${projectId}.firebaseio.com`
      });
    }
    db = getFirestore(app);
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    db = undefined;
  }
} else {
  console.warn(
    'Firebase credentials are not set in .env file. Database operations will not be available.'
  );
}

export {app, db};
