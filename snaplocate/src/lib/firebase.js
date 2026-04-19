import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDB2bm2KBo6geTRSlVHOhqhUQX-6Mozp1Y",
  authDomain: "snaplocateproject.firebaseapp.com",
  projectId: "snaplocateproject",
  storageBucket: "snaplocateproject.firebasestorage.app",
  messagingSenderId: "150513277214",
  appId: "1:150513277214:web:e7fef8e692bd89af65510f",
  measurementId: "G-5P19DM1V01"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);