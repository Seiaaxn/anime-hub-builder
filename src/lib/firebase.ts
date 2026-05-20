import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyActmXTykTLOnwaGJ2tbMpTnb0pg-1floU",
  authDomain: "kanachat-ffeb7.firebaseapp.com",
  databaseURL: "https://kanachat-ffeb7-default-rtdb.firebaseio.com",
  projectId: "kanachat-ffeb7",
  storageBucket: "kanachat-ffeb7.firebasestorage.app",
  messagingSenderId: "755917977291",
  appId: "1:755917977291:web:9b0bf4da0d64536697cd4e",
  measurementId: "G-PYNK0BED5P",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
