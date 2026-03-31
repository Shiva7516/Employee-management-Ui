import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

interface User {
  username: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:5000/api/auth'; 
  private tokenKey = 'accessToken';

  user = signal<User | null>(this.loadUser());

  constructor() {
    window.addEventListener('beforeunload', () => {
      localStorage.removeItem('accessToken');
    });
  }
  // ===== LOGIN =====
  login(username: string, password: string) {
    return this.http.post<{accessToken: string, refreshToken: string}>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          // Store token in local storage
          localStorage.setItem(this.tokenKey, response.accessToken);
          
          // Decode the JWT token to get user info (role, username)
          const decodedPayload = this.decodeToken(response.accessToken);
          const loggedInUser: User = { username: decodedPayload.username, role: decodedPayload.role };
          
          this.user.set(loggedInUser);
        })
      );
  }

  // ===== REGISTER EMPLOYEE =====
  register(username: string, password: string) {
    const token = localStorage.getItem(this.tokenKey);
    // Passing the token in the headers so the backend knows you are an authenticated Admin
    return this.http.post(`${this.apiUrl}/users`, 
      { username, password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  // ===== LOGOUT =====
  logout() {
    localStorage.removeItem(this.tokenKey);
    this.user.set(null);
    // Optionally call your backend logout endpoint
    // this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
  }

  isLoggedIn() {
    return !!this.user();
  }

  hasRole(role: 'ADMIN' | 'EMPLOYEE') {
    return this.user()?.role === role;
  }

  // Helper method to decode JWT token payload without external libraries
  private decodeToken(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }

  private loadUser(): User | null {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded) {
        return { username: decoded.username, role: decoded.role };
      }
    }
    return null;
  }
}