import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  nombre: string;
  email: string;
  role: 'admin' | 'profesor' | 'estudiante';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('current_user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

    switchRole(newRole: 'admin' | 'profesor' | 'estudiante') {
    const user = this.getCurrentUser();
    if (user) {
      user.role = newRole;
      localStorage.setItem('current_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          // Guardar token
          localStorage.setItem('auth_token', response.access_token);

          // Decodificar token para obtener info del usuario
          const payload = this.decodeToken(response.access_token);
          const user: User = {
            id: payload.user_id,
            nombre: payload.nombre || email.split('@')[0],
            email: payload.sub,
            role: payload.rol,
          };

          localStorage.setItem('current_user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  register(userData: {
    email: string;
    password: string;
    rol: string;
    nombre: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    // Verificar que el token no haya expirado
    return this.isTokenValid();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isTokenValid(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      if (!payload) return false;

      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/refresh`, {});
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));

      // Verificar estructura del token
      if (!decoded.sub || !decoded.rol || !decoded.user_id) {
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      console.error('Error decodificando token:', error);
      this.logout();
      return null;
    }
  }
}
