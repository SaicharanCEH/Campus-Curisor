import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "campus-cruiser-465117.firebaseapp.com",
  projectId: "campus-cruiser-465117",
  storageBucket: "campus-cruiser-465117.appspot.com",
  messagingSenderId: "302679725677",
  appId: "1:302679725677:web:29542020f16ea2d69cd164",
  measurementId: "G-JR12JRTYV0",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
