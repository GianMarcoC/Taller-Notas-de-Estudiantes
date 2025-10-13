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
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  /** 🔹 Cargar usuario almacenado al iniciar la app */
  private loadUserFromStorage() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('current_user');

    if (token && userData) {
      try {
        const user: User = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (err) {
        console.error('⚠️ Error al leer current_user del storage:', err);
        this.logout();
      }
    }
  }

  /** 🔹 Cambiar de rol manualmente (debug o pruebas) */
  switchRole(newRole: 'admin' | 'profesor' | 'estudiante') {
    const user = this.getCurrentUser();
    if (user) {
      user.role = newRole;
      localStorage.setItem('current_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    }
  }

  /** 🔹 Login del usuario */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response.access_token) {
            console.log('✅ Token recibido:', response.access_token);
            localStorage.setItem('auth_token', response.access_token);

            // Si el backend devuelve el usuario directamente
            if (response.user) {
              console.log('👤 Usuario recibido desde backend:', response.user);
              localStorage.setItem(
                'current_user',
                JSON.stringify(response.user)
              );
              this.currentUserSubject.next(response.user);
            } else {
              // Si no, lo decodificamos manualmente desde el JWT
              const payload = this.decodeToken(response.access_token);
              if (payload) {
                const user: User = {
                  id: payload.user_id || 0,
                  nombre: payload.nombre || payload.name || '',
                  email: payload.sub,
                  role: payload.rol || payload.role || 'estudiante',
                };
                console.log('🧩 Usuario construido desde token:', user);
                localStorage.setItem('current_user', JSON.stringify(user));
                this.currentUserSubject.next(user);
              }
            }
          }
        })
      );
  }

  /** 🔹 Registrar usuario */
  register(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, usuario);
  }

  /** 🔹 Logout (eliminar sesión) */
  logout(): void {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  /** 🔹 Obtener usuario actual */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** 🔹 Verificar si el usuario está autenticado */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    const valid = this.isTokenValid();
    console.log('🔐 Token válido?', valid);
    return valid;
  }

  /** 🔹 Verificar si el usuario tiene un rol permitido */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    const has = user?.role === role || (user as any)?.rol === role;
    console.log(`🎭 Verificando rol "${role}":`, has);
    return has;
  }

  /** 🔹 Verificar si el token aún no expiró */
  isTokenValid(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      const valid = payload.exp > now;
      if (!valid) console.warn('⚠️ Token expirado');
      return valid;
    } catch (err) {
      console.error('❌ Error verificando token:', err);
      return false;
    }
  }

  /** 🔹 Refrescar token (si tu backend lo permite) */
  refreshToken(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, {});
  }

  /** 🔹 Decodificar token JWT */
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      console.log('🧩 Token decodificado:', decoded);
      return decoded;
    } catch (error) {
      console.error('❌ Error decodificando token:', error);
      return null;
    }
  }
}
