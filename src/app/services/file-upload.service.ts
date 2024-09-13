import { Injectable } from "@angular/core";
import { getDownloadURL, getStorage, ref, uploadBytes } from "@angular/fire/storage";
import { FilePreview } from "../interfaces/file-preview";
import { ThreadFilePreview } from "../interfaces/thread-file-preview";

@Injectable({
   providedIn: "root",
})
export class FileUploadService {
   constructor() {}

   async uploadFile(file: File): Promise<string> {
      const storage = getStorage();
      const storageRef = ref(storage, `uploads/${new Date().getTime()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
   }

   async uploadAllFiles(filePreviews: FilePreview[]): Promise<string[]> {
      const uploadPromises = filePreviews.map((filePreview) => this.uploadFile(filePreview.file));
      return await Promise.all(uploadPromises);
   }

   async handleFileInput(event: any, filePreviews: FilePreview[]): Promise<FilePreview[]> {
      const files = [...event.target.files];

      const processedFilePreviews: FilePreview[] = [];

      for (const file of files) {
         if (file.size <= 500 * 1024 && (file.type.startsWith("image/") || file.type === "application/pdf")) {
            const fileUrl = URL.createObjectURL(file);
            if (file.type === "application/pdf") {
               processedFilePreviews.push({
                  url: fileUrl,
                  name: file.name,
                  type: file.type,
                  file: file,
               });
            } else {
               const reader = new FileReader();
               const result = await this.readFileAsDataURL(reader, file);
               processedFilePreviews.push({
                  url: result,
                  name: file.name,
                  type: file.type,
                  file: file,
               });
            }
         } else {
            alert("Only images and PDFs under 500KB are allowed.");
         }
      }

      return [...filePreviews, ...processedFilePreviews];
   }

   private readFileAsDataURL(reader: FileReader, file: File): Promise<string> {
      return new Promise((resolve) => {
         reader.onload = (e: any) => resolve(e.target.result);
         reader.readAsDataURL(file);
      });
   }

   // Neue Methode für den Thread-Kontext
   async handleThreadFileInput(event: any, threadFilePreviews: ThreadFilePreview[]): Promise<ThreadFilePreview[]> {
      const files = [...event.target.files];

      const processedThreadFilePreviews: ThreadFilePreview[] = [];

      for (const file of files) {
         if (file.size <= 500 * 1024 && (file.type.startsWith("image/") || file.type === "application/pdf")) {
            const fileUrl = URL.createObjectURL(file);
            if (file.type === "application/pdf") {
               processedThreadFilePreviews.push({
                  url: fileUrl,
                  name: file.name,
                  type: file.type,
                  file: file,
               });
            } else {
               const reader = new FileReader();
               const result = await this.readFileAsDataURL(reader, file);
               processedThreadFilePreviews.push({
                  url: result,
                  name: file.name,
                  type: file.type,
                  file: file,
               });
            }
         } else {
            alert("Only images and PDFs under 500KB are allowed.");
         }
      }

      return [...threadFilePreviews, ...processedThreadFilePreviews];
   }
}
