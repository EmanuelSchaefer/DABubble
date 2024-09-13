import { Routes } from "@angular/router";
import { LoginComponent } from "./auth/login/login.component";
import { HomeComponent } from "./main-content/home/home.component";
import { RegisterUserComponent } from "./auth/register-user/register-user.component";
import { AuthenticationMainComponent } from "./auth/authentication-main/authentication-main.component";
import { PickAvatarComponent } from "./auth/pick-avatar/pick-avatar.component";
import { ImpressumComponent } from "./auth/impressum/impressum.component";
import { DatenschutzComponent } from "./auth/datenschutz/datenschutz.component";
import { ForgotPasswordComponent } from "./auth/forgot-password/forgot-password.component";
import { ChangePasswordComponent } from "./auth/change-password/change-password.component";
import { ChannelContentComponent } from "./main-content/home/channel-content/channel-content.component";

export const routes: Routes = [
   {
      path: "",
      component: AuthenticationMainComponent,
      children: [
         { path: "login", component: LoginComponent },
         { path: "register-user", component: RegisterUserComponent },
         { path: "avatar", component: PickAvatarComponent },
         { path: "", redirectTo: "login", pathMatch: "full" },
         { path: "impressum", component: ImpressumComponent },
         { path: "datenschutz", component: DatenschutzComponent },
         { path: "forgotPassword", component: ForgotPasswordComponent },
         { path: "change-password", component: ChangePasswordComponent },
      ],
   },
   {
      path: "home",
      component: HomeComponent,
      children: [{ path: ":id", component: ChannelContentComponent }],
   },
];
