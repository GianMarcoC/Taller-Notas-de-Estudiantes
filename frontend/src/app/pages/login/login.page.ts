import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  IonicModule,
  AlertController,
  LoadingController,
} from '@ionic/angular';
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
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
  const token = sessionStorage.getItem('auth_token');
  if (token && this.authService.isAuthenticated()) {
    console.log('🔐 Sesión activa, redirigiendo a /home');
    this.router.navigate(['/home']);
  }
}

  async login() {
    if (!this.email.trim() || !this.password.trim()) {
      this.mostrarAlerta(
        'Campos incompletos',
        'Por favor completa todos los campos.'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent',
    });
    await loading.present();

    this.authService.login(this.email, this.password).subscribe({
      next: async (response: any) => {
        await loading.dismiss();
        console.log('✅ Login exitoso:', response);
        // Si backend devolvió user lo tenemos en currentUserSubject ya
        this.router.navigate(['/home']);
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('❌ Error al iniciar sesión:', err);
        this.mostrarAlerta(
          'Error',
          'Usuario o contraseña incorrectos, o problema con el servidor.'
        );
      },
      complete: () => console.log('🔁 Petición de login completada'),
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
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
