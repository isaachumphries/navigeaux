import {db} from "./firebase";
import {collection, query, where, getDocs, addDoc} from "firebase/firestore";

class EventRepository{
    async fetchApprovedEvent(){
    const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/navigeaux-48a87/databases/(default)/documents/Events`  );
    const data = await response.json();
    console.log("raw firestore response:", data);
    if (!data.documents) return [];
    return data.documents
        .map((doc: any) => ({
            id: doc.name.split('/').pop(),
            ...Object.fromEntries(
                Object.entries(doc.fields).map(([k, v]: any) => [k, v.stringValue || v.integerValue])
            )
        }))
        .filter((event: any) => event.status === "approved");
};
    async addEvent({ title, club, description, room, day }: { title: string, club: string, description: string, room: string, day: string }) {
        await addDoc(collection(db, "Events"), {
            title,
            club,
            description,
            room,
            day,
            status: "pending"
        });
    };
    async pinEvent(userID:string, eventID: string){
        await addDoc(collection(db,"pinnedEvents"),{
            userID, 
            eventID, 
            pinnedAt: new Date()
        });
    };
}
export const eventRepository = new EventRepository();