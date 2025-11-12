import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;

    // Si no está autenticado, redirigir al login
    if (!this.authService.isAuthenticated()) {
      this.logger.warn('Usuario no autenticado. Redirigiendo a login...');
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener usuario actual del servicio (NO usar localStorage directamente)
    const user = this.authService.getCurrentUser();

    if (!user || !user.role) {
      this.logger.warn('No hay rol definido en el usuario');
      this.router.navigate(['/login']);
      return false;
    }

    // Validar si el rol está permitido
    const hasRequiredRole = expectedRoles.includes(user.role);

    if (!hasRequiredRole) {
      this.logger.warn('Rol no autorizado', {
        requiredRoles: expectedRoles,
        currentRole: user.role,
        userId: user.id, // Solo ID, no información sensible
      });
      this.router.navigate(['/home']);
      return false;
    }

    this.logger.debug('Acceso permitido para rol', {
      role: user.role,
      requiredRoles: expectedRoles,
      userId: user.id,
    });
    return true;
  }
}
