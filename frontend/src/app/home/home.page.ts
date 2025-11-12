import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
})
export class HomePage implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.logger.debug('Usuario actual cargado', { 
      id: this.user?.id, 
      role: this.user?.role 
    });

    // Si no hay usuario, redirigir a login
    if (!this.user) {
      this.router.navigate(['/login']);
    }
  }

  switchRole(event: any) {
    const newRole = event.detail.value;
    this.logger.debug('Cambiando rol', { newRole });
    this.authService.switchRole(newRole);

    // Actualizar el usuario localmente
    this.user = this.authService.getCurrentUser();
    this.logger.debug('Nuevo usuario configurado', { 
      id: this.user?.id, 
      role: this.user?.role 
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleColor(): string {
    switch (this.user?.role) {
      case 'admin':
        return 'danger';
      case 'profesor':
        return 'warning';
      case 'estudiante':
        return 'success';
      default:
        return 'primary';
    }
  }

  hasAvailableOptions(): boolean {
    if (!this.user) return false;

    switch (this.user.role) {
      case 'admin':
        return true;
      case 'profesor':
        return true;
      case 'estudiante':
        return true;
      default:
        return false;
    }
  }
}