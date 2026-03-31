import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MATERIAL_IMPORT } from '../../shared/material/material.imports';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule,CommonModule,
    ...MATERIAL_IMPORT
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  errorMsg = '';

  loading = false;

  login() {
    this.loading = true;

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        const user = this.auth.user();
        this.loading = false;

        if (user?.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/employee']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Invalid username or password';
      }
    });
  }
}
