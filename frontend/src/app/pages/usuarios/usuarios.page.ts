import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
})
export class UsuariosPage {
  users = [
    { id: 1, nombre: 'Carlos Pérez', email: 'carlos@uni.edu', rol: 'admin' },
    { id: 2, nombre: 'Laura Gómez', email: 'laura@uni.edu', rol: 'profesor' },
    { id: 3, nombre: 'Andrés Díaz', email: 'andres@uni.edu', rol: 'estudiante' },
  ];
}
