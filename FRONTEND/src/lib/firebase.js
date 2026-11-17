import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requiredConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const firebaseConfig = {
  ...requiredConfig,
  apiKey: requiredConfig.apiKey || "missing-firebase-api-key",
  authDomain: requiredConfig.authDomain || "missing.firebase.invalid",
  projectId: requiredConfig.projectId || "missing-firebase-project",
  storageBucket: requiredConfig.storageBucket || "missing-firebase-project.appspot.com",
  messagingSenderId: requiredConfig.messagingSenderId || "0",
  appId: requiredConfig.appId || "1:0:web:missing",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const isFirebaseConfigured = missingConfig.length === 0;
