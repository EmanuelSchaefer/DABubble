import { inject, Injectable } from "@angular/core";
import { doc, Firestore, getDoc, updateDoc } from "@angular/fire/firestore";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { AuthenticationService } from "./authentication.service";

@Injectable({
   providedIn: "root",
})
export class PrivateChatService {
   privateChatOpenSubject = new BehaviorSubject<boolean>(false);
   otherUserIdSubject = new BehaviorSubject<string | null>(null);
   privateChatIdSubject = new BehaviorSubject<string | null>(null);

   privateChatOpen$ = this.privateChatOpenSubject.asObservable();
   otherUserId$ = this.otherUserIdSubject.asObservable();
   privateChatId$ = this.privateChatIdSubject.asObservable();

   authService = inject(AuthenticationService);
   firestore = inject(Firestore);

   openPrivateChat(otherUserId: string, privateChatId: string): void {
      this.privateChatOpenSubject.next(true);
      this.otherUserIdSubject.next(otherUserId);
      this.privateChatIdSubject.next(privateChatId);
   }

   closePrivateChat(): void {
      this.privateChatOpenSubject.next(false);
      this.otherUserIdSubject.next(null);
      this.privateChatIdSubject.next(null);
   }

   getPrivateChatUserId(): string | null {
      return this.otherUserIdSubject.value;
   }

   getPrivateChatId(): string | null {
      return this.privateChatIdSubject.value;
   }

   setPrivateChatId(privateChatId: string): void {
      this.privateChatIdSubject.next(privateChatId);
   }

   async addReactionToPrivateMessage(privateChatId: string, messageId: string, emoji: string): Promise<void> {
      const user = await firstValueFrom(this.authService.getCurrentUser());
      if (user) {
         const userId = user.uid;
         const chatDocRef = doc(this.firestore, `privateChats/${privateChatId}`);
         const chatSnap = await getDoc(chatDocRef);

         if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const messages = chatData?.["messages"] || [];
            const messageIndex = messages.findIndex((msg: any) => msg.messageId === messageId);

            if (messageIndex !== -1) {
               const message = messages[messageIndex];
               if (!message.reactions) {
                  message.reactions = {};
               }

               if (!message.reactions[emoji]) {
                  message.reactions[emoji] = [];
               }

               const reactionIndex = message.reactions[emoji].indexOf(userId);

               if (reactionIndex === -1) {
                  message.reactions[emoji].push(userId);
               } else {
                  message.reactions[emoji].splice(reactionIndex, 1);
               }

               await updateDoc(chatDocRef, { messages });
            }
         }
      }
   }

   async updatePrivateMessageReactions(privateChatId: string, messageId: string, reactions: any): Promise<void> {
      const chatDocRef = doc(this.firestore, `privateChats/${privateChatId}`);
      const chatSnap = await getDoc(chatDocRef);

      if (chatSnap.exists()) {
         const chatData = chatSnap.data();
         const messages = chatData?.["messages"] || [];

         let messageFound = false;

         for (const message of messages) {
            if (message.messageId === messageId) {
               message.reactions = reactions;
               messageFound = true;
               break;
            }

            if (message.answers && message.answers.length > 0) {
               const answerIndex = message.answers.findIndex((ans: any) => ans.messageId === messageId);

               if (answerIndex !== -1) {
                  message.answers[answerIndex].reactions = reactions;
                  messageFound = true;
                  break;
               }
            }
         }

         if (messageFound) {
            await updateDoc(chatDocRef, { messages });
         } else {
            throw new Error(`Message with ID ${messageId} not found`);
         }
      } else {
         throw new Error("Private chat not found");
      }
   }
}
