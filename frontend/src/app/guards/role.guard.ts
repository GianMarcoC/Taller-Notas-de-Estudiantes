import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;

    // Si no está autenticado, redirigir al login
    if (!this.authService.isAuthenticated()) {
      console.warn('🚫 Usuario no autenticado. Redirigiendo a login...');
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener usuario actual (ya sea del BehaviorSubject o localStorage)
    let user = this.authService.getCurrentUser();
    if (!user) {
      const stored = localStorage.getItem('current_user');
      if (stored) {
        try {
          user = JSON.parse(stored);
        } catch {
          console.error('Error al parsear current_user');
        }
      }
    }

    if (!user || !user.role) {
      console.warn('⚠️ No hay rol definido en el usuario');
      this.router.navigate(['/login']);
      return false;
    }

    // Validar si el rol está permitido
    const hasRequiredRole = expectedRoles.includes(user.role);

    if (!hasRequiredRole) {
      console.warn('⛔ Rol no autorizado:', user.role);
      this.router.navigate(['/home']);
      return false;
    }

    console.log('✅ Acceso permitido para rol:', user.role);
    return true;
  }
}
