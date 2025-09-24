
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config();

let app: App | undefined;
let db: Firestore | undefined;

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
  try {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
      });
    }
    db = getFirestore(app);
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    db = undefined; 
  }
} else {
  console.warn('Firebase credentials are not set. Database operations will not be available.');
}


export { app, db };
