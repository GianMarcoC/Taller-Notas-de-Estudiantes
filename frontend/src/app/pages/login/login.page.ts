import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage implements OnInit {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Si ya está autenticado, redirigir a home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.mostrarError('Por favor completa todos los campos');
      return;
    }

    // Simulamos el login según el username
    let role: 'estudiante' | 'profesor' | 'admin' = 'estudiante';

    if (
      this.username.toLowerCase().includes('admin') ||
      this.username.toLowerCase().includes('administrador')
    ) {
      role = 'admin';
    } else if (
      this.username.toLowerCase().includes('profesor') ||
      this.username.toLowerCase().includes('docente')
    ) {
      role = 'profesor';
    }

    this.authService.switchRole(role);
    this.router.navigate(['/home']);
  }

  // Función para el botón de registrarse
  irARegistro() {
    this.router.navigate(['/registro']);
  }

  quickLogin(role: 'estudiante' | 'profesor' | 'admin') {
    // Asignar un username según el rol para la simulación
    switch (role) {
      case 'admin':
        this.username = 'admin@sistema.com';
        break;
      case 'profesor':
        this.username = 'profesor@sistema.com';
        break;
      case 'estudiante':
        this.username = 'estudiante@sistema.com';
        break;
    }
    this.password = 'password123';

    this.authService.switchRole(role);
    this.router.navigate(['/home']);
  }

  private mostrarError(mensaje: string) {
    // En una app real usarías un toast o alert
    alert(mensaje);
  }
}
