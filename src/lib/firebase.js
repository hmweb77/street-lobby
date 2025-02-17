// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);