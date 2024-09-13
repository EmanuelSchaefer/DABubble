import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";

@Injectable({
   providedIn: "root",
})
export class ThreadService {
   openThreadSubject = new Subject<void>();
   closeThreadSubject = new Subject<void>();
   messageIdSubject = new Subject<string>();
   channelIdSubject = new Subject<string>();
   privateChatIdSubject = new Subject<string>();

   openThread$ = this.openThreadSubject.asObservable();
   closeThread$ = this.closeThreadSubject.asObservable();
   messageId$ = this.messageIdSubject.asObservable();
   channelId$ = this.channelIdSubject.asObservable();
   privateChatId$ = this.privateChatIdSubject.asObservable();

   private threadOpenedSubject = new BehaviorSubject<boolean>(false);
   threadOpened$ = this.threadOpenedSubject.asObservable();

   openThread(channelIdOrPrivateChatId: string, messageId: string) {
      if (!channelIdOrPrivateChatId) {
         throw new Error("channelIdOrPrivateChatId is undefined");
      }

      if (channelIdOrPrivateChatId.startsWith("privateChats")) {
         this.privateChatIdSubject.next(channelIdOrPrivateChatId);
      } else {
         this.channelIdSubject.next(channelIdOrPrivateChatId);
      }
      this.messageIdSubject.next(messageId);
      this.openThreadSubject.next();
      this.threadOpenedSubject.next(true);
   }

   closeThread() {
      this.closeThreadSubject.next();
      this.threadOpenedSubject.next(false);
   }
}
