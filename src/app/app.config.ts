import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { provideClientHydration } from "@angular/platform-browser";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { getFirestore, provideFirestore } from "@angular/fire/firestore";
import { getStorage, provideStorage } from "@angular/fire/storage";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { firebaseSettings } from "../env";

export const appConfig: ApplicationConfig = {
   providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes),
      provideClientHydration(),
      provideFirebaseApp(() => initializeApp(firebaseSettings)),
      provideAuth(() => getAuth()),
      provideFirestore(() => getFirestore()),
      provideStorage(() => getStorage()),
      provideAnimationsAsync(),
      provideAnimationsAsync(),
   ],
};