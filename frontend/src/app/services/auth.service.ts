import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoggerService } from './logger.service';

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
  private apiUrl = 'http://3.145.217.121:8000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Claves para almacenamiento seguro
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.loadUserFromStorage();
  }

  /** 🔹 Cargar usuario almacenado al iniciar la app */
  private loadUserFromStorage() {
    const token = this.getToken();
    const userData = this.getStoredUser();

    if (token && userData) {
      try {
        const user: User = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (err) {
        this.logger.error('Error al leer current_user del storage', err);
        this.logout();
      }
    }
  }

  /** 🔹 Almacenamiento seguro del token */
  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  /** 🔹 Obtener token de forma segura */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /** 🔹 Almacenamiento seguro del usuario (solo datos necesarios) */
  setCurrentUser(user: User): void {
    const safeUserData = {
      id: user.id,
      nombre: user.nombre,
      role: user.role
    };
    
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(safeUserData));
    this.currentUserSubject.next(user);
  }

  /** 🔹 Obtener usuario almacenado de forma segura */
  private getStoredUser(): string | null {
    return sessionStorage.getItem(this.USER_KEY);
  }

  /** 🔹 Cambiar de rol manualmente (debug o pruebas) */
  switchRole(newRole: 'admin' | 'profesor' | 'estudiante') {
    const user = this.getCurrentUser();
    if (user) {
      user.role = newRole;
      this.setCurrentUser(user);
    }
  }

  /** 🔹 Login del usuario */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response.access_token) {
            this.logger.debug('Token recibido');
            this.setToken(response.access_token);

            // Si el backend devuelve el usuario directamente
            if (response.user) {
              this.logger.debug('Usuario recibido desde backend');
              this.setCurrentUser(response.user);
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
                this.logger.debug('Usuario construido desde token', {
                  id: user.id,
                  role: user.role
                });
                this.setCurrentUser(user);
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
    this.logger.debug('Cerrando sesión');
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  /** 🔹 Obtener usuario actual */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** 🔹 Verificar si el usuario está autenticado */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const valid = this.isTokenValid();
    this.logger.debug('Token válido?', { valid });
    return valid;
  }

  /** 🔹 Verificar si el usuario tiene un rol permitido */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    const has = user?.role === role || (user as any)?.rol === role;
    this.logger.debug(`Verificando rol "${role}"`, { has });
    return has;
  }

  /** 🔹 Verificar si el token aún no expiró */
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      const valid = payload.exp > now;
      if (!valid) this.logger.warn('Token expirado');
      return valid;
    } catch (err) {
      this.logger.error('Error verificando token', err);
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
      this.logger.debug('Token decodificado');
      return decoded;
    } catch (error) {
      this.logger.error('Error decodificando token', error);
      return null;
    }
  }

  /** 🔹 Limpiar todo el almacenamiento (para debugging) */
  clearStorage(): void {
    sessionStorage.clear();
    this.currentUserSubject.next(null);
  }
}