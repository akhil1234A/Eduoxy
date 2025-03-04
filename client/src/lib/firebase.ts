import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAun_He1rPmEiahxl4yMLXYK57ihgQoUhM",
  authDomain: "eduoxy-57553.firebaseapp.com",
  projectId: "eduoxy-57553",
  storageBucket: "eduoxy-57553.firebasestorage.app",
  messagingSenderId: "104941945408",
  appId: "1:104941945408:web:cb1cad10f0034d12d855a5",
  measurementId: "G-PB1FLTY6B1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
