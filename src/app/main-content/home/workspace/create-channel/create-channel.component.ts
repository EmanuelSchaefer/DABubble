import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, query, where, getDocs } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { MatDialogRef } from "@angular/material/dialog";
import { FormsModule } from "@angular/forms";
import { AddChannel } from "../../../../models/addChannel.class";
import { AuthenticationService } from "../../../../services/authentication.service";

@Component({
   selector: "app-create-channel",
   standalone: true,
   imports: [CommonModule, FormsModule],
   templateUrl: "./create-channel.component.html",
   styleUrl: "./create-channel.component.scss",
})
export class CreateChannelComponent {
   authService = inject(AuthenticationService);
   channelName: string = "";
   channelDescription: string = "";
   channelExists: boolean = false;
   firestore: Firestore = inject(Firestore);
   items$: Observable<any[]>;
   channel = new AddChannel();
   showSuccessMessage: boolean = false;

   constructor(public dialogRef: MatDialogRef<CreateChannelComponent>) {
      const aCollection = collection(this.firestore, "items");
      this.items$ = collectionData(aCollection);
   }

   async create() {
      const channelCollection = collection(this.firestore, "channel");
      this.channel.channelName = this.channelName;
      this.channel.description = this.channelDescription || "";
      this.channel.userAccess.push(this.authService.currentCustomUser!);

      const creatorName = this.authService.currentCustomUser ? this.authService.currentCustomUser.name : "Guest";
      const docRef = await addDoc(channelCollection, { ...this.channel, creatorName: creatorName });

      const channelDoc = doc(this.firestore, `channel/${docRef.id}`);
      await updateDoc(channelDoc, { channelId: docRef.id });
      this.showSuccessMessage = true;
      setTimeout(() => this.dialogRef.close(this.channel), 2500);
   }

   closeDialog(): void {
      this.dialogRef.close();
   }

   async createChannel() {
      if (this.canCreateChannel()) {
         await this.create();
         this.channelName = "";
         this.channelDescription = "";
      }
   }

   async checkChannelAvailability() {
      const q = query(collection(this.firestore, "channel"), where("channelName", "==", this.channelName));
      const querySnapshot = await getDocs(q);
      this.channelExists = !querySnapshot.empty;
   }

   channelIsAvailable(): boolean {
      return this.channelExists;
   }

   canCreateChannel(): boolean {
      return this.channelName.trim() !== "" && !this.channelIsAvailable();
   }
}
