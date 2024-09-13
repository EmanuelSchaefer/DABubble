import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './datenschutz.component.html',
  styleUrl: './datenschutz.component.scss'
})
export class DatenschutzComponent {

  constructor(private router: Router) { }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}