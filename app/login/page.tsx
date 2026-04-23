"use client";

import { loginWithGoogle } from "../authAdapter";
import { useRouter } from "next/navigation";
{/*signInWithPopUp opens a popup window when the user clicks the button
    userRouter direct users to the main page after login in*/}

export default function Login(){
    const router= useRouter();
    const handleGoogleLogin = async() => {
        try {
                await loginWithGoogle();
                router.push("/");
        }
            catch(error){
                alert("Log in failed! LSU emails only")
            }  
        };
    return (
        <main className="relative w-screen h-screen overflow-hidden font-sans">
           
            <div className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage:"url('/campus.jpg')"}}/>

            <div className="absolute inset-0  bg-violet-400/70"/>

            <section className="absolute inset-0 z-10 flex items-center justify-center px-7">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-10 max-w-md w-full text-center shadow-2xl">
                    <h1 
                        style={{fontFamily:"'Georgia', serif"}}
                        className="text-white text-3xl font-bold leading-tight mb-4"
                        > Log In <br />
                    </h1>
                    <p 
                        className="text-white/80 text-base leading-relaxed mb-8">
                        Please log in with your LSU email!
                    </p>
                    <button
                        onClick={handleGoogleLogin} 
                        className="px-8 py-3 rounded-full bg-[#FDD023] text-[#461D7C] font-bold text-sm hover:bg-yellow-300 transition-all duration-200 shadow-lg">
                    Google Sign In 
                    </button>
                </div>
            </section>
        </main>
    );
}