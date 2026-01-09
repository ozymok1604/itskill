import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  OAuthProvider,
  Auth,
} from "firebase/auth";
import { Platform } from "react-native";

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
function initAuth(): Auth {
  if (Platform.OS === "web") {
    // Web: use getAuth (auto-uses browser persistence)
    return getAuth(app);
  } else {
    // Native: use AsyncStorage persistence
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const { getReactNativePersistence } = require("firebase/auth");
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

export const auth = initAuth();

// ---------------------------
// AUTH PROVIDERS
// ---------------------------
export const appleProvider = new OAuthProvider("apple.com");
