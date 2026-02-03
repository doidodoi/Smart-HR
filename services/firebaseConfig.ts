import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Robust environment variable getter to handle different build tools and environments.
 */
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}

  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  return "";
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID')
};

// Initialize Firebase only if config is present (at least a few key fields)
const isFirebaseReady = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

const app = isFirebaseReady 
  ? initializeApp(firebaseConfig) 
  : initializeApp({ apiKey: "placeholder", projectId: "placeholder" });

export const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * @param file The file object (File or Blob)
 * @param path The path in storage (e.g., 'cvs/filename.pdf')
 */
export const uploadFile = async (file: File | Blob, path: string): Promise<string> => {
    if (!isFirebaseReady) {
        throw new Error("Firebase is not configured. Please set environment variables.");
    }
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Firebase Upload Error:", error);
        throw new Error("Failed to upload file to Cloud Storage.");
    }
};
