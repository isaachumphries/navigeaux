import { auth, googleProvider} from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";

    export const loginWithGoogle = async() => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const email = result.user.email;
            if (!email || !email.endsWith("@lsu.edu")){
                await signOut(auth);
                throw new Error("Please sign in with LSU email");
            }
            return result.user;
        }
            catch(error){
                throw error;
            }  
    };

    export const logoutUser = async() => {
        return signOut(auth);
    }
    
    //current user is instant so no async 
    export const getCurrentUser = () => {
        return auth.currentUser;
    }
