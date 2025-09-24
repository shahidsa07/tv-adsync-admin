import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config();

// This is a service account that can be used to authenticate with Firebase Admin.
// It is safe to use in a server-only environment.
// Do not expose this to the client.
const serviceAccount = {
  projectId: 'studio-7399364451-b8cc3',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
};

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const app = getFirebaseAdminApp();
const db = getFirestore(app);

export { app, db };
