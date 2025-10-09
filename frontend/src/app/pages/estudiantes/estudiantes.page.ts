import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './estudiantes.page.html',
  styleUrls: ['./estudiantes.page.scss'],
})
export class EstudiantesPage {
  estudiantes = [
    { nombre: 'María López', codigo: '2023123', carrera: 'Ingeniería' },
    { nombre: 'Pedro Ruiz', codigo: '2023011', carrera: 'Multimedia' },
  ];
}
