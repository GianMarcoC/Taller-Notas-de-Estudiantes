import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';
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
    private logger: LoggerService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    const token = this.authService.getToken();
    if (token && this.authService.isAuthenticated()) {
      this.logger.debug('Sesión activa, redirigiendo a /home');
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

    this.logger.debug('Intentando login', { 
      email: '***REDACTED***' 
    });

    this.authService.login(this.email, this.password).subscribe({
      next: async (response: any) => {
        this.logger.debug('Login exitoso');

        if (response.access_token) {
          // 🔐 Guardar token usando el servicio seguro
          this.authService.setToken(response.access_token);

          try {
            // 🧩 Decodificar token JWT
            const payload = JSON.parse(
              atob(response.access_token.split('.')[1])
            );
            this.logger.debug('Token decodificado');

            // 🔎 Determinar rol y usuario (solo datos necesarios)
            const userRole = payload.rol || payload.role || 'estudiante';
            const userData = {
              id: payload.user_id || 0,
              nombre: payload.nombre || payload.name || '',
              email: payload.sub,
              role: userRole,
            };

            // 💾 Guardar usuario usando el servicio seguro (solo datos no sensibles)
            this.authService.setCurrentUser(userData);

            await loading.dismiss();

            this.logger.debug('Usuario autenticado', { 
              role: userRole 
            });
            this.router.navigate(['/home']);
          } catch (error) {
            await loading.dismiss();
            this.logger.error('Error decodificando token', error);
            this.mostrarAlerta('Error', 'El token recibido no es válido.');
          }
        } else {
          await loading.dismiss();
          this.mostrarAlerta(
            'Error',
            'El servidor no devolvió un token válido.'
          );
        }
      },

      error: async (err) => {
        this.logger.error('Error al iniciar sesión', err);
        await loading.dismiss();
        this.mostrarAlerta(
          'Error',
          'Usuario o contraseña incorrectos, o problema con el servidor.'
        );
      },

      complete: () => this.logger.debug('Petición de login completada'),
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