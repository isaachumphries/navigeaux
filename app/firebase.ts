//singleton pattern: one firebase instance 
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaErf3FPGGBDnf06t__MAZMYm3JtsJdlM",
  authDomain: "navigeaux-48a87.firebaseapp.com",
  projectId: "navigeaux-48a87",
  storageBucket: "navigeaux-48a87.firebasestorage.app",
  messagingSenderId: "872378132682",
  appId: "1:872378132682:web:b5d6522ee98d86d5e2ac33",
  measurementId: "G-QCJ63626KV"
};
class FirebaseService{
  //only one instance 
  private static instance: FirebaseService;
    public auth;
    public db;
    public googleProvider;
    //prevent creating multiple instances 
    private constructor(){
      const app = initializeApp(firebaseConfig);
      this.auth = getAuth(app);
      this.db = getFirestore(app, "(default)");
      this.googleProvider = new GoogleAuthProvider();
      this.googleProvider.setCustomParameters({hd:"lsu.edu"});
    }
    public static getInstance(): FirebaseService {
      //no instance exists, create one, otherwise return existing one 
      if (!FirebaseService.instance){
        FirebaseService.instance = new FirebaseService();
      }
      return FirebaseService.instance;
      }
    }

    export const firebaseService = FirebaseService.getInstance();
    export const auth = firebaseService.auth;
    export const db = firebaseService.db;
    export const googleProvider = firebaseService.googleProvider;
