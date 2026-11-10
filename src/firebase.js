import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCjpB-uoGdXs3hrCsOL3ef9i325mDzdcAs",
  authDomain: "mains-mock-portal.firebaseapp.com",
  projectId: "mains-mock-portal",
  storageBucket: "mains-mock-portal.firebasestorage.app",
  messagingSenderId: "201904134324",
  appId: "1:201904134324:web:2f2b79bf5e763e3e64dfe1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
