import { Timestamp } from "firebase/firestore";

export interface Message {
   messageId: string;
   userId: string;
   timestamp: Timestamp;
   userName: string;
   text: string;
   profilePicture: string;
   files?: { url: string; name: string; type: string }[];
   reactions?: { [emote: string]: string[] };
   answers?: Message[];
}
