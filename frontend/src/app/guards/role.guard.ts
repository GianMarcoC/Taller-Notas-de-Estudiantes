import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    if (!this.authService.hasAnyRole(expectedRoles)) {
      // Redirigir a home si no tiene permisos
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
