"use client";

import Link from "next/link";
import {useState, useEffect} from "react";
import {eventRepository} from "../eventRepository";

export default function Events(){
    const [selectedDay, setSelectedDay]=useState<string|null>(null);
    const [selectedEvent,setSelectedEvent]=useState<any>(null);
    const [events, setEvents]=useState([]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const fetchEvents = async () => {
            const data = await eventRepository.fetchApprovedEvent();
            console.log("events:", data);
            setEvents(data);
        };
        fetchEvents();
    }, []);

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekdays = Array.from({length:7}, (_,i)=>{
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return{
            name: date.toLocaleDateString("en-US", { weekday: "short" }),
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            full: date.toDateString()
        };
    });

    return(
        <main className="relative w-screen h-screen overflow-y-auto font-sans">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/campus.jpg')" }}/>
            <div className="absolute inset-0 bg-violet-400/70" />
            <div className="relative z-10">
                <h1 style={{ fontFamily: "'Georgia', serif" }} className="text-white text-3xl font-bold leading-tight mb-4 text-center pt-6">
                    Event Tracker
                </h1>
                <div className="flex justify-center mb-4">
                    <Link href="/events/add">
                        <button className="px-6 py-2 rounded-full border-2 border-[#FDD023] text-[#FDD023] font-semibold text-sm hover:bg-[#FDD023] hover:text-[#461D7C] transition-all duration-200">
                            Add Event
                        </button>
                    </Link>
                </div>
                <div className="flex gap-2 px-6 py-4">
                    {weekdays.map((day) =>(
                        <button 
                            key={day.full}
                            onClick={() => setSelectedDay(day.full)}
                            className="flex-1 py-3 rounded-xl text-center text-white border border-white/30 bg-[#FDD023] transition-all duration-200">
                            <p className="font-bold text-sm">{day.name}</p>
                            <p className="text-xs">{day.date}</p>
                        </button>
                    ))}
                </div>
                {selectedDay && (
                    <div className="px-6 py-4">
                        <h2 className="text-white text-xl font-bold mb-3">Events for {selectedDay}</h2>
                        {events
                            .filter((event:any) => event.day === selectedDay)
                            .map((event:any) => (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-3 cursor-pointer hover:bg-white/20 transition-all duration-200">
                                    <p className="text-white font-bold">{event.title}</p>
                                    <p className="text-white/70 text-sm">{event.club}</p>
                                </div>
                            ))}
                    </div>
                )}
                {selectedEvent && (
                    <div className="px-6 py-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <h2 className="text-white text-xl font-bold mb-2">{selectedEvent.title}</h2>
                            <p className="text-white/70 text-sm mb-1">{selectedEvent.club}</p>
                            <p className="text-white/80 text-base leading-relaxed mb-4">{selectedEvent.description}</p>
                            <Link href={`/?room=${encodeURIComponent(selectedEvent.room)}`}>
                                <p className="text-[#FDD023] font-bold hover:underline cursor-pointer">
                                    Room: {selectedEvent.room} - click to navigate
                                </p>
                            </Link>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="mt-4 px-4 py-2 rounded-full border border-white/30 text-white text-sm hover:bg-white/20 transition-all duration-200">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}