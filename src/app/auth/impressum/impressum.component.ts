import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [CommonModule, RouterLink,],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.scss'
})
export class ImpressumComponent {

  constructor(private router: Router) { }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}