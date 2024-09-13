import { Injectable, inject, signal } from "@angular/core";
import {
   Auth,
   createUserWithEmailAndPassword,
   signInWithEmailAndPassword,
   sendPasswordResetEmail,
   signInWithPopup,
   GoogleAuthProvider,
   onAuthStateChanged,
   user,
   confirmPasswordReset,
   signInAnonymously,
} from "@angular/fire/auth";
import { Firestore, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "@angular/fire/firestore";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { User, updateProfile } from "firebase/auth";
import { BehaviorSubject, Observable } from "rxjs";
import { UserProfile } from "../interfaces/user-profile.interface";
import { ChannelService } from "./channel.service";

@Injectable({
   providedIn: "root",
})
export class AuthenticationService {
   auth = inject(Auth);
   firestore = inject(Firestore);
   router = inject(Router);
   // channelService = inject(ChannelService);
   currentCustomUser: UserProfile | null = null;
   currentUser: User | null = null;

   isGuestLogin = signal(false);

   registerForm = new FormGroup({
      name: new FormControl("", [Validators.required]),
      email: new FormControl("", [Validators.required, Validators.email]),
      password: new FormControl("", [Validators.required, Validators.minLength(6)]),
      privacyPolicy: new FormControl(false, [Validators.required]),
   });

   avatar: string = "";
   isSuccessMessageVisible = false;

   defaultGuestPhotoUrl: string = "./public/img/profile-pics-register/avatar_default.png";

   async onSubmitRegistrationComplete() {
      const emailControl = this.registerForm.get("email");
      const passwordControl = this.registerForm.get("password");
      const nameControl = this.registerForm.get("name");

      if (this.avatar !== "" && emailControl && passwordControl && nameControl) {
         const email = emailControl.value;
         const password = passwordControl.value;
         const name = nameControl.value;

         if (email && password && name) {
            await this.register(email, password).then((response) => {
               updateProfile(response.user, {
                  photoURL: this.avatar,
                  displayName: name,
               }).then(async () => {
                  response.user.reload();
                  const userProfile: UserProfile = {
                     uid: response.user.uid,
                     name: response.user.displayName || "Unknown",
                     email: response.user.email || "",
                     photoUrl: response.user.photoURL || this.defaultGuestPhotoUrl,
                     status: "offline",
                     lastUpdated: Date.now(),
                  };
                  await this.createUserProfile(response.user);
                  await this.addUserToChannel("MeCr1XlRySnaAv81qBMK", userProfile);
                  this.isSuccessMessageVisible = true;
                  setTimeout(() => {
                     this.router.navigate(["/login"]);
                  }, 2400);
               });
            });
         }
      }
   }

   async addUserToChannel(channelId: string, userProfile: UserProfile) {
      try {
         const channelDocRef = doc(this.firestore, `channel/${channelId}`);
         await updateDoc(channelDocRef, {
            userAccess: arrayUnion(userProfile),
         });
      } catch (error) {
         console.error("Error adding user to channel:", error);
         throw error;
      }
   }

   register(email: string, password: string) {
      return createUserWithEmailAndPassword(this.auth, email, password);
   }

   login(email: string, password: string) {
      this.isGuestLogin.set(false);
      return signInWithEmailAndPassword(this.auth, email, password);
   }

   resetPassword(email: string) {
      const actionCodeSettings = {
         url: "https://dabubble-242.developerakademie.net/angular-projects/dabubble/change-password",
         handleCodeInApp: true,
      };
      this.auth.useDeviceLanguage();
      return sendPasswordResetEmail(this.auth, email, actionCodeSettings);
   }

   googleSignIn() {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(this.auth, provider);
   }

   async createUserProfile(user: User) {
      const userRef = doc(this.firestore, "users", user.uid);
      await setDoc(userRef, {
         uid: user.uid,
         name: user.displayName || "Gast",
         email: user.email || "Anonymer Benutzer",
         photoUrl: user.photoURL || this.defaultGuestPhotoUrl,
         conversations: [],
         status: "offline",
      });
   }

   async logout() {
      if (this.currentUser) {
         try {
            if (this.currentUser.isAnonymous) {
               const userRef = doc(this.firestore, "users", this.currentUser.uid);
               const userDoc = await getDoc(userRef);

               if (userDoc.exists()) {
                  await this.updateUserStatusToOffline(this.currentUser);
                  await this.deleteUserProfile(this.currentUser.uid);
               }
            } else {
               await this.updateUserStatusToOffline(this.currentUser);
            }
            await this.auth.signOut();
         } catch (error) {
            console.error("Fehler beim Ausloggen:", error);
         }
      }
   }

   async deleteUserProfile(uid: string): Promise<void> {
      try {
         const userRef = doc(this.firestore, "users", uid);
         await deleteDoc(userRef);

         const channelsRef = collection(this.firestore, "channel");
         const channelsSnapshot = await getDocs(channelsRef);

         for (const channelDoc of channelsSnapshot.docs) {
            const channelData = channelDoc.data();
            const userToRemove = channelData["userAccess"].find((user: any) => user.uid === uid);
            if (userToRemove) {
               await updateDoc(channelDoc.ref, {
                  userAccess: arrayRemove(userToRemove),
               });
            }
         }
      } catch (error) {
         console.error("Fehler beim Löschen des Benutzerprofils und der Zugriffsrechte:", error);
      }
   }

   async saveAvatar(uid: string, avatarUrl: string) {
      const userRef = doc(this.firestore, `users/${uid}`);
      await updateDoc(userRef, { avatar: avatarUrl });
   }

   checkLoginStatus() {
      onAuthStateChanged(this.auth, (user) => {
         if (user) {
            this.currentUser = user;
            this.getCustomUserProfile(user.uid);
         } else {
            this.currentUser = null;
            this.router.navigateByUrl("/login");
         }
      });
   }

   async getCustomUserProfile(userId: string) {
      const userRef = doc(this.firestore, `users`, userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
         this.currentCustomUser = docSnap.data() as UserProfile;
      }
   }

   async updateUserStatusToOnline(user: User) {
      const userRef = doc(this.firestore, "users", user.uid);
      await updateDoc(userRef, { status: "online" });
   }

   async updateUserStatusToOffline(user: User) {
      const userRef = doc(this.firestore, "users", user.uid);
      await updateDoc(userRef, { status: "offline" });
   }

   async isUserRegistered(email: string): Promise<boolean> {
      const q = query(collection(this.firestore, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
   }

   async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
      await confirmPasswordReset(this.auth, code, newPassword);
   }

   getCurrentUser(): Observable<User | null> {
      return user(this.auth);
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

   async guestLogin() {
      try {
         const userCredential = await signInAnonymously(this.auth);
         this.currentUser = userCredential.user;
         this.isGuestLogin.set(true);

         await updateProfile(this.currentUser, {
            displayName: "Gast",
            photoURL: this.defaultGuestPhotoUrl,
         });

         const userProfile: UserProfile = {
            uid: this.currentUser.uid,
            name: "Gast",
            email: "Anonymer Benutzer",
            photoUrl: this.defaultGuestPhotoUrl,
            conversations: [],
            status: "offline",
            lastUpdated: Date.now(),
         };
         await this.createUserProfile(this.currentUser);
         await this.addUserToChannel("MeCr1XlRySnaAv81qBMK", userProfile);
      } catch (error) {
         console.error("Error during anonymous login:", error);
      }
   }

   async updateProfile(profileData: Partial<User>) {
      if (this.currentUser) {
         await updateProfile(this.currentUser, profileData);
      }
   }
}
