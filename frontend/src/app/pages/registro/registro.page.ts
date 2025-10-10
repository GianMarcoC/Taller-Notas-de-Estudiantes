import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UsuarioRegistro {
  nombre: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: 'estudiante' | 'profesor';
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegistroPage {
  usuario: UsuarioRegistro = {
    nombre: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'estudiante'
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  registrar() {
    // Validaciones básicas
    if (!this.validarFormulario()) {
      return;
    }

    // Simular registro exitoso
    console.log('Registrando usuario:', this.usuario);
    
    // En una app real, aquí llamarías al servicio de auth
    // this.authService.register(this.usuario).subscribe(...)
    
    // Por ahora simulamos el registro
    this.mostrarExito('Cuenta creada exitosamente');
    
    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      this.irALogin();
    }, 2000);
  }

  validarFormulario(): boolean {
    if (!this.usuario.nombre.trim()) {
      this.mostrarError('Por ingresa tu nombre completo');
      return false;
    }

    if (!this.usuario.email.trim() || !this.validarEmail(this.usuario.email)) {
      this.mostrarError('Por ingresa un correo electrónico válido');
      return false;
    }

    if (!this.usuario.username.trim()) {
      this.mostrarError('Por ingresa un nombre de usuario');
      return false;
    }

    if (!this.usuario.password.trim() || this.usuario.password.length < 6) {
      this.mostrarError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (this.usuario.password !== this.usuario.confirmPassword) {
      this.mostrarError('Las contraseñas no coinciden');
      return false;
    }

    if (!this.usuario.role) {
      this.mostrarError('Por selecciona un tipo de usuario');
      return false;
    }

    return true;
  }

  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  private mostrarError(mensaje: string) {
    alert('Error: ' + mensaje);
  }

  private mostrarExito(mensaje: string) {
    alert('Éxito: ' + mensaje);
  }
}