import { initializeApp } from "firebase/app";
import {
  initializeAuth,
 
  OAuthProvider,
} from "firebase/auth";
 
import AsyncStorage from "@react-native-async-storage/async-storage";
//@ts-ignore
import {getReactNativePersistence } from "firebase/auth";


// ---------------------------
// FIREBASE CONFIG
// ---------------------------
const firebaseConfig = {
  apiKey: "AIzaSyApSfoHn1TQPz6ZJSfTazX3uYNe_TyWukY",
  authDomain: "skillup-efd18.firebaseapp.com",
  projectId: "skillup-efd18",
  storageBucket: "skillup-efd18.firebasestorage.app",
  messagingSenderId: "372124290442",
  appId: "1:372124290442:web:a64a85c92f2b31e723cc73",
  measurementId: "G-M2ZKX1C29Z",
};

// ---------------------------
// INITIALIZE APP
// ---------------------------
const app = initializeApp(firebaseConfig);

// ---------------------------
// AUTH WITH PERSISTENCE
// ---------------------------
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// ---------------------------
// AUTH PROVIDERS
// ---------------------------
export const appleProvider = new OAuthProvider("apple.com");
