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

    // Check if user has any of the expected roles
    const hasRequiredRole = expectedRoles.some(role => 
      this.authService.hasRole(role)
    );

    if (!hasRequiredRole) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}