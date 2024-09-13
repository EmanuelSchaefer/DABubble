import { Injectable, inject, signal } from "@angular/core";
import { Firestore, collection, onSnapshot, query, where } from "@angular/fire/firestore";
import { UserProfile } from "../interfaces/user-profile.interface";

@Injectable({
   providedIn: "root",
})
export class UserService {
   firestore = inject(Firestore);
   onlineUser = signal<UserProfile[]>([]);
   offlineUser = signal<UserProfile[]>([]);

   getAllOnlineUser() {
      const q = query(collection(this.firestore, "users"), where("status", "==", "online"));
      return onSnapshot(q, (snapshot) => {
         const users: UserProfile[] = [];
         snapshot.forEach((doc) => {
            users.push(doc.data() as UserProfile);
         });
         this.onlineUser.set(users);
      });
   }

   getAllOfflineUser() {
      const q = query(collection(this.firestore, "users"), where("status", "==", "offline"));
      return onSnapshot(q, (snapshot) => {
         const users: UserProfile[] = [];
         snapshot.forEach((doc) => {
            users.push(doc.data() as UserProfile);
         });
         this.offlineUser.set(users);
      });
   }

   getUserByName(name: string): UserProfile | undefined {
      const allUsers = [...this.onlineUser(), ...this.offlineUser()];
      return allUsers.find((user) => user.name === name);
   }
}
