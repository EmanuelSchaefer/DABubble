import { inject, Injectable } from "@angular/core";
import { Firestore, arrayUnion, collection, collectionData, doc, docData, getDoc, updateDoc } from "@angular/fire/firestore";
import { BehaviorSubject, firstValueFrom, map, Observable, of, Subject } from "rxjs";
import { AuthenticationService } from "./authentication.service";
import { Message } from "../interfaces/message.interface";
import { setDoc } from "firebase/firestore";
import { PrivateChatService } from "./private-chat.service";
import { Router } from "@angular/router";

@Injectable({
   providedIn: "root",
})
export class ChannelService {
   private privateChatOpen = false;

   private currentChannelNameSubject: BehaviorSubject<string>;
   public currentChannelNameObservable: Observable<string>;
   authService = inject(AuthenticationService);
   privateChatService = inject(PrivateChatService);
   router = inject(Router);

   private privateChatUserId = new Subject<string>();

   private privateChatIdSubject = new BehaviorSubject<string | null>(null);
   public privateChatIdObservable = this.privateChatIdSubject.asObservable();

   private currentChannelIdSubject = new BehaviorSubject<string | null>(null);
   currentChannelId$ = this.currentChannelIdSubject.asObservable();

   constructor(public firestore: Firestore) {
      this.currentChannelNameSubject = new BehaviorSubject<string>("");
      this.currentChannelNameObservable = this.currentChannelNameSubject.asObservable();
   }

   setCurrentChannelName(channelName: string) {
      this.currentChannelNameSubject.next(channelName);
   }

   getCurrentChannelName(): Observable<string> {
      return this.currentChannelNameObservable;
   }

   getChannelById(id: string): Observable<any> {
      this.currentChannelIdSubject.next(id);
      const channelDoc = doc(this.firestore, `channel/${id}`);
      return docData(channelDoc, { idField: "id" });
   }

   addMessageToChannel(channelId: string, message: any): Promise<void> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      return updateDoc(channelDoc, {
         messages: arrayUnion(message),
      });
   }

   updateChannelName(channelId: string, newName: string): Promise<void> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      return updateDoc(channelDoc, { channelName: newName });
   }

   updateChannelDescription(channelId: string, newDescription: string): Promise<void> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      return updateDoc(channelDoc, { description: newDescription });
   }

   async updateReactions(channelId: string, messageId: string, reactions: any): Promise<void> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      const channelSnap = await getDoc(channelDoc);

      if (channelSnap.exists()) {
         const channelData = channelSnap.data();
         const messages = channelData["messages"] || [];
         const messageIndex = messages.findIndex((msg: any) => msg.messageId === messageId);

         if (messageIndex !== -1) {
            messages[messageIndex].reactions = reactions;
            await updateDoc(channelDoc, { messages });
         }
      }
   }

   async leaveChannel(channelId: string): Promise<void> {
      try {
         const userId = this.authService.currentUser?.uid;
         if (userId) {
            const channelDoc = doc(this.firestore, `channel/${channelId}`);
            const channelSnap = await getDoc(channelDoc);

            if (channelSnap.exists()) {
               const channelData = channelSnap.data();
               const userAccess = channelData["userAccess"] || [];
               const updatedUserAccess = userAccess.filter((user: any) => user.email !== this.authService.currentUser?.email);
               await updateDoc(channelDoc, { userAccess: updatedUserAccess });
            }
         }
      } catch (error) {
         console.error("Fehler beim Verlassen des Channels:", error);
      }
   }

   async getUsersInChannel(channelId: string): Promise<any[]> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      const channelSnapshot = await getDoc(channelDoc);
      if (channelSnapshot.exists()) {
         const channelData = channelSnapshot.data();
         return channelData["userAccess"] || [];
      } else {
         return [];
      }
   }

   async updateMessage(channelId: string, messageId: string, newText: string): Promise<void> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      const channelSnap = await getDoc(channelDoc);

      if (channelSnap.exists()) {
         const channelData = channelSnap.data();
         const messages = channelData["messages"] || [];
         const messageIndex = messages.findIndex((msg: any) => msg.messageId === messageId);
         if (messageIndex !== -1) {
            messages[messageIndex].text = newText;
            await updateDoc(channelDoc, { messages });
         } else {
            console.error("Message not found with ID:", messageId);
         }
      } else {
         console.error("Channel not found with ID:", channelId);
      }
   }

   async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> { }

   getAllChannels(): Observable<any[]> {
      const channelsCollection = collection(this.firestore, "channel");
      return collectionData(channelsCollection, { idField: "id" });
   }

   async isUserMentionedInMessage(message: any): Promise<boolean> {
      const currentUser = this.authService.currentUser;
      if (!currentUser) {
         return false;
      }
      const username = currentUser.displayName || currentUser.email;
      return message.text.includes(`@${username}`);
   }

   async addReplyToMessage(channelId: string, messageId: string, reply: Message): Promise<void> {
      const channelDoc = doc(this.firestore, `channel/${channelId}`);
      const channelSnap = await getDoc(channelDoc);

      if (channelSnap.exists()) {
         const channelData = channelSnap.data();
         const messages = channelData["messages"] || [];
         const messageIndex = messages.findIndex((msg: Message) => msg.messageId === messageId);

         if (messageIndex !== -1) {
            if (!messages[messageIndex].answers) {
               messages[messageIndex].answers = [];
            }
            messages[messageIndex].answers.push(reply);
            await updateDoc(channelDoc, { messages });
         } else {
            throw new Error("Message not found");
         }
      } else {
         throw new Error("Channel not found");
      }
   }

   async addReplyToThreadMessage(collectionPath: string, messageId: string, reply: Message): Promise<void> {
      try {
         const channelDoc = doc(this.firestore, `channel/${collectionPath}`);
         const channelSnap = await getDoc(channelDoc);

         if (channelSnap.exists()) {
            const channelData = channelSnap.data();
            const messages = channelData["messages"] || [];

            const messageIndex = messages.findIndex((msg: Message) => msg.messageId === messageId);

            if (messageIndex !== -1) {
               if (!messages[messageIndex].answers) {
                  messages[messageIndex].answers = [];
               }

               messages[messageIndex].answers.push(reply);

               await updateDoc(channelDoc, { messages });
            } else {
               throw new Error("Message not found");
            }
         } else {
            throw new Error("Channel not found");
         }
      } catch (error) {
         console.error("Error adding reply to thread message:", error);
         throw error;
      }
   }

   getPrivateChatUserId(): Observable<string> {
      return this.privateChatUserId.asObservable();
   }

   openPrivateChat(userId: string) {
      this.privateChatUserId.next(userId);
   }

   getPrivateMessages(otherUserId: string): Observable<Message[]> {
      const currentUser = this.authService.currentUser;
      if (currentUser) {
         const privateChatId = [currentUser.uid, otherUserId].sort().join("_");
         const chatDoc = doc(this.firestore, `privateChats/${privateChatId}`);
         return docData(chatDoc).pipe(
            map((data: any) => {
               return data && data.messages ? (data.messages as Message[]) : [];
            })
         );
      }
      return of([]);
   }

   async getUserNameById(userId: string): Promise<string> {
      const userDoc = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userDoc);
      if (userSnap.exists()) {
         const userData = userSnap.data();
         return userData["name"];
      } else {
         return "";
      }
   }

   async addPrivateMessage(otherUserId: string, message: Message): Promise<void> {
      try {
         const currentUser = await firstValueFrom(this.authService.getCurrentUser());
         if (currentUser) {
            const privateChatId = [currentUser.uid, otherUserId].sort().join("_");
            this.privateChatService.setPrivateChatId(privateChatId);
            const chatDoc = doc(this.firestore, `privateChats/${privateChatId}`);
            const docSnapshot = await getDoc(chatDoc);

            if (!docSnapshot.exists()) {
               await setDoc(chatDoc, { messages: [] });
            }

            await updateDoc(chatDoc, {
               messages: arrayUnion(message),
            });
         }
      } catch (error) {
         console.error("Error adding private message:", error);
         return Promise.resolve(); // Return a resolved promise if there's an error
      }
   }

   async getUserNameAndProfilePicById(userId: string): Promise<{ name: string; photoUrl: string }> {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      return {
         name: userData?.["name"] || "Unknown User",
         photoUrl: userData?.["photoUrl"] || "default-profile-pic-url",
      };
   }

   closePrivateChat(): void {
      this.privateChatOpen = false;
   }

   async addReplyToPrivateMessage(privateChatId: string, messageId: string, reply: Message): Promise<void> {
      const chatDoc = doc(this.firestore, `privateChats/${privateChatId}`);
      const chatSnap = await getDoc(chatDoc);

      if (chatSnap.exists()) {
         const chatData = chatSnap.data();
         const messages = chatData["messages"] || [];
         const messageIndex = messages.findIndex((msg: Message) => msg.messageId === messageId);

         if (messageIndex !== -1) {
            if (!messages[messageIndex].answers) {
               messages[messageIndex].answers = [];
            }
            messages[messageIndex].answers.push(reply);
            await updateDoc(chatDoc, { messages });
         } else {
            throw new Error("Message not found");
         }
      } else {
         throw new Error("Private chat not found");
      }
   }

   getPrivateMessageReplies(privateChatId: string, messageId: string): Observable<Message[]> {
      const chatDoc = doc(this.firestore, `privateChats/${privateChatId}`);
      return docData(chatDoc).pipe(
         map((data: any) => {
            if (!data || !Array.isArray(data.messages)) {
               return [];
            }

            const message = data.messages.find((msg: Message) => msg.messageId === messageId);
            return message ? message.answers || [] : [];
         })
      );
   }

   async addMessageToCollection(collectionPath: string, message: Message): Promise<void> {
      const [collectionSegment, documentSegment, ...rest] = collectionPath.split("/");
      const documentPath = `${collectionSegment}/${documentSegment}`;
      const docRef = doc(this.firestore, documentPath);

      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
         throw new Error(`Document at path ${documentPath} does not exist.`);
      }

      await updateDoc(docRef, {
         messages: arrayUnion(message),
      });
   }

   navigateToChannel(channelId: string) {
      this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => {
         this.router.navigate(["/home", channelId]);
      });
   }

   navigateToOverview() {
      this.router.navigate(["/home"]);
   }
}