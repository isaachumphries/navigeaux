"use client";
import {useState} from "react";
import {eventRepository} from "../../eventRepository";
import { useRouter } from "next/navigation";
export default function AddEvent(){
    const [title, setTitle] = useState("");
    const [club, setClub] = useState("");
    const [description, setDescription] = useState("");
    const [room, setRoom] = useState("");
    const [day, setDay] = useState("");
    const router= useRouter(); 
    const handleSubmit = async() => {
            try {
                    eventRepository.addEvent(title, club, day, description, room );
                    router.push("/events");
            }
                catch(error){
                    alert("Please try again");
                }  
            };
    return (
         <main className="relative w-screen h-screen overflow-hidden font-sans">
           
            <div className="absolute inset-0 bg-cover bg-center"
            style={{backgroundImage:"url('/campus.jpg')"}}/>

            <div className="absolute inset-0  bg-violet-400/70"/>
            <section className="absolute inset-0 z-10 flex items-center justify-center px-7">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-10 max-w-md w-full text-center shadow-2xl">
                {/*form*/}
                    <h1 
                        style={{fontFamily:"'Georgia', serif"}}
                        className="text-white text-3xl font-bold leading-tight mb-4"
                        > Add Event <br />
                    </h1>
                    <input 
                        type="text"
                        placeholder="Event Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 mb-3 outline-none"
                    />
                    <input 
                        type="text"
                        placeholder="Club"
                        value={club}
                        onChange={(e) => setClub(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 mb-3 outline-none"
                    />
                    <input
                    type="text"
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 mb-3 outline-none"
                    />
                    <input
                    type="text"
                        placeholder="Room"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 mb-3 outline-none"
                    />
                    <input
                    type="text"
                        placeholder="Day ex:Fri Apr 24 2026"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white/20 text-white placeholder-white/50 border border-white/30 mb-3 outline-none"
                    />
                    <button 
                        onClick={handleSubmit}
                        className="w-full px-6 py-3 rounded-full bg-[#fdd023] text-[#461d7c] font-bold text-sm hover:bg-tellow-300 transition-all duration-200 shadow-lg mt-2">
                            Submit
                        </button>
                </div>
            </section>
            </main>

    );
}