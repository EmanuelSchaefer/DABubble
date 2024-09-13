import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthenticationService } from './services/authentication.service';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  authService = inject(AuthenticationService);
  router = inject(Router);

  ngOnInit(): void {
    this.authService.checkLoginStatus();
  }

  // -----------ENABLE THIS BEFORE DEVELOPMENT----------- //

  // @HostListener('window:beforeunload', ['$event'])
  // beforeUnloadHandler(event: any): void {
  //   this.authService.logout();
  // }
}
