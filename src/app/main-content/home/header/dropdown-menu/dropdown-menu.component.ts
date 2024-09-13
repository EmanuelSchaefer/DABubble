import { Component, ElementRef, HostListener, inject, ViewChild } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { RouterLink } from "@angular/router";
import { AuthenticationService } from "../../../../services/authentication.service";
import { DialogProfileComponent } from "./dialog-profile/dialog-profile.component";
import { DialogRef } from "@angular/cdk/dialog";

@Component({
   selector: "app-dropdown-menu",
   standalone: true,
   imports: [MatButtonModule, RouterLink],
   templateUrl: "./dropdown-menu.component.html",
   styleUrl: "./dropdown-menu.component.scss",
})
export class DropdownMenuComponent {
   dialog = inject(MatDialog);
   dialogRef = inject(DialogRef<DropdownMenuComponent>);
   authService = inject(AuthenticationService);

   @ViewChild("dropdownContainer") dropdownContainer!: ElementRef;

   openDialog() {
      if (this.dropdownContainer) {
         const rect = this.dropdownContainer.nativeElement.getBoundingClientRect();
         let leftPosition = rect.left - 300;
         let topPosition = "90";
         let height = "";

         if (window.innerWidth <= 950) {
            leftPosition = window.innerWidth - 580;
         }
         if (window.innerWidth <= 600) {
            leftPosition = 0;
            topPosition = "0";
            height = "100";
         }

         this.dialog.open(DialogProfileComponent, {
            position: { left: `${leftPosition}px`, top: `${topPosition}px` },
            panelClass: "dropdown-dialog",
            autoFocus: false,
            data: { user: this.authService.currentUser, currentUser: true },
            height: `${height}vh`,
         });
      }
   }

   logout() {
      this.dialogRef.close();
      this.authService.logout();
      this.authService.isGuestLogin.set(false);
   }
}
