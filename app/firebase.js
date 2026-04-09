import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaErf3FPGGBDnf06t__MAZMYm3JtsJdlM",
  authDomain: "navigeaux-48a87.firebaseapp.com",
  projectId: "navigeaux-48a87",
  storageBucket: "navigeaux-48a87.firebasestorage.app",
  messagingSenderId: "872378132682",
  appId: "1:872378132682:web:b5d6522ee98d86d5e2ac33",
  measurementId: "G-QCJ63626KV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  hd: "lsu.edu"
});