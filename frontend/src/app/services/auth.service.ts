import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  id: number;
  username: string;
  role: 'estudiante' | 'profesor' | 'admin';
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Auto-login con estudiante por defecto
    this.autoLogin();
  }

  autoLogin(role: 'estudiante' | 'profesor' | 'admin' = 'estudiante'): void {
    let user: User;

    switch (role) {
      case 'admin':
        user = {
          id: 1,
          username: 'admin@test.com',
          role: 'admin',
          nombre: 'Administrador del Sistema',
        };
        break;
      case 'profesor':
        user = {
          id: 2,
          username: 'profesor@test.com',
          role: 'profesor',
          nombre: 'Profesor Ejemplo',
        };
        break;
      case 'estudiante':
      default:
        user = {
          id: 3,
          username: 'estudiante@test.com',
          role: 'estudiante',
          nombre: 'Estudiante Demo',
        };
        break;
    }

    this.login(user);
  }

  login(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    console.log('Usuario logueado:', user);
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Método para cambiar de rol
  switchRole(newRole: 'estudiante' | 'profesor' | 'admin'): void {
    console.log('Cambiando a rol:', newRole);
    this.autoLogin(newRole);
  }
}
