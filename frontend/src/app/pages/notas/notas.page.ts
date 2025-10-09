import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './notas.page.html',
  styleUrls: ['./notas.page.scss'],
})
export class NotasPage {
  notas = [
    { estudiante: 'Pedro Ruiz', materia: 'Matemáticas', valor: 4.5, profesor: 'Laura Gómez', fecha: '2025-10-08' },
    { estudiante: 'María López', materia: 'Programación', valor: 4.8, profesor: 'Carlos Pérez', fecha: '2025-10-07' },
  ];
}
