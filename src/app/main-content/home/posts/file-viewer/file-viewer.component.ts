import { NgIf } from "@angular/common";
import { Component, Inject, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";

@Component({
   selector: "app-file-viewer",
   standalone: true,
   imports: [MatDialogModule, NgIf],
   templateUrl: "./file-viewer.component.html",
   styleUrl: "./file-viewer.component.scss",
})
export class FileViewerComponent {
   dialogRef = inject(MatDialogRef<FileViewerComponent>);
   data = inject(MAT_DIALOG_DATA) as { fileUrl: string; fileType: string };

   closeDialog(): void {
      this.dialogRef.close();
   }
}
