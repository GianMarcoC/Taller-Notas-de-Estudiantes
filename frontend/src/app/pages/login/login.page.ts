import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true, // 👈 importante
  imports: [IonicModule, CommonModule, FormsModule], // 👈 aquí agregamos IonicModule
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  usuario = '';
  password = '';
  intentos = 0;

  login() {
    if (this.usuario === 'admin' && this.password === '123') {
      console.log('Inicio de sesión exitoso');
    } else {
      this.intentos++;
      console.log('Credenciales incorrectas. Intento:', this.intentos);
    }
  }
}
