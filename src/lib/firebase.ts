import {getApps, initializeApp, cert, App} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';
import * as serviceAccount from '../../service-account.json';

let app: App | undefined;
let db: Firestore | undefined;

// This is a type assertion to handle the case where the JSON is empty.
const effectiveServiceAccount = serviceAccount as {
  project_id?: string;
  private_key?: string;
  client_email?: string;
};

if (
  effectiveServiceAccount.project_id &&
  effectiveServiceAccount.private_key &&
  effectiveServiceAccount.client_email
) {
  try {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    }
    db = getFirestore(app);
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message);
    db = undefined;
  }
} else {
  console.warn(
    'Firebase credentials in service-account.json are not set. Database operations will not be available.'
  );
}

export {app, db};
