import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  AlertController,
  IonicModule,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class RegistroPage {
  usuario = {
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: '',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  async registrar() {
    if (
      !this.usuario.nombre.trim() ||
      !this.usuario.email.trim() ||
      !this.usuario.password.trim() ||
      !this.usuario.confirmPassword.trim() ||
      !this.usuario.rol.trim()
    ) {
      this.mostrarAlerta(
        'Campos incompletos',
        'Por favor completa todos los campos.'
      );
      return;
    }

    if (this.usuario.password !== this.usuario.confirmPassword) {
      this.mostrarAlerta('Error', 'Las contraseñas no coinciden.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando cuenta...',
      spinner: 'crescent',
    });
    await loading.present();

    const nuevoUsuario = {
      nombre: this.usuario.nombre,
      email: this.usuario.email,
      password: this.usuario.password,
      rol: this.usuario.rol,
    };

    console.log('📤 Enviando usuario al backend:', nuevoUsuario);

    this.authService.register(nuevoUsuario).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        console.log('✅ Registro exitoso:', res);
        this.mostrarAlerta('Éxito', 'Tu cuenta ha sido creada correctamente.');
        this.router.navigate(['/login']);
      },
      error: async (err: any) => { // ✅ tipado explícito
        await loading.dismiss();
        console.error('❌ Error al registrar:', err);

        let mensaje = 'Ocurrió un error al crear la cuenta.';
        if (err.error?.detail) {
          mensaje = err.error.detail;
        }

        this.mostrarAlerta('Error', mensaje);
      },
    });
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
