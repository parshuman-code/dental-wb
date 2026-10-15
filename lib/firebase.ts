// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBod6MhvKanJ85X-3FkogAuyOw2y2RWfdA",
  authDomain: "dental-web-2ebaf.firebaseapp.com",
  projectId: "dental-web-2ebaf",
  storageBucket: "dental-web-2ebaf.firebasestorage.app",
  messagingSenderId: "940753065535",
  appId: "1:940753065535:web:c48f146d7682264c1a4a8a",
  measurementId: "G-KLL0VVN8L6"
};

// Initialize Firebase (Prevents duplicate initialization error in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };