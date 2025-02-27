

// Import the functions you need from the Firebase SDK
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDr4Qi-Mp1ZhojRIZ6_7VOLDp4eAJ2NnuI",
  authDomain: "street-lobby.firebaseapp.com",
  projectId: "street-lobby",
  storageBucket: "street-lobby.firebasestorage.app",
  messagingSenderId: "694197968225",
  appId: "1:694197968225:web:299ae9cf0c54ab05d77920",
  measurementId: "G-MJXBB01JZ3"
};

// Initialize Firebase
export const App = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(App);
