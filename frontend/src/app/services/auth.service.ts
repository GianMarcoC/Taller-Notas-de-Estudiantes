import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  nombre: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://ec2-3-145-217-121.us-east-2.compute.amazonaws.com:8000'; // URL de tu backend FastAPI
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = sessionStorage.getItem('current_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /** 🔹 Login */
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/api/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response.access_token) {
            const payload = JSON.parse(atob(response.access_token.split('.')[1]));
            const userData: User = {
              id: payload.user_id || 0,
              nombre: payload.nombre || payload.name || '',
              email: payload.sub,
              role: payload.rol || payload.role || 'estudiante',
            };

            // Guardamos datos temporalmente (NO sensibles) en sessionStorage
            sessionStorage.setItem('auth_token', response.access_token);
            sessionStorage.setItem('current_user', JSON.stringify(userData));
            this.currentUserSubject.next(userData);
          }
        })
      );
  }

  /** 🔹 Registro de usuario */
  register(user: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user);
  }

  /** 🔹 Obtener token almacenado */
  getToken(): string | null {
    return sessionStorage.getItem('auth_token');
  }

  /** 🔹 Cerrar sesión */
  logout(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  /** 🔹 Obtener usuario actual */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** 🔹 Verificar autenticación */
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('auth_token');
  }

  /** 🔹 Cambiar rol (usado en home.page.ts) */
  switchRole(newRole: string): void {
    const user = this.getCurrentUser();
    if (user) {
      const updatedUser = { ...user, role: newRole };
      sessionStorage.setItem('current_user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }
}
