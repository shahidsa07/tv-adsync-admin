// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "studio-7399364451-b8cc3",
  appId: "1:96736714317:web:668d8776dad8d6046dc604",
  apiKey: "AIzaSyChylDhBqFWeGOgr8ONlJ0YK24hyNHtnBE",
  authDomain: "studio-7399364451-b8cc3.firebaseapp.com",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
