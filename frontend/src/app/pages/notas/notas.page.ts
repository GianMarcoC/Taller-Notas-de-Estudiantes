import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Nota {
  id: number;
  estudiante: string;
  curso: string;
  evaluacion: string;
  nota: number;
  fecha: string;
}

@Component({
  selector: 'app-notas',
  templateUrl: './notas.page.html',
  styleUrls: ['./notas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class NotasPage implements OnInit {
  user: User | null = null;
  notas: Nota[] = [];
  notasFiltradas: Nota[] = [];
  cursoFiltro: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.cargarNotas();
  }

  cargarNotas() {
    // Datos de ejemplo
    this.notas = [
      {
        id: 1,
        estudiante: 'Ana García',
        curso: 'Matemáticas',
        evaluacion: 'Parcial 1',
        nota: 4.5,
        fecha: '2024-03-15',
      },
      {
        id: 2,
        estudiante: 'Carlos López',
        curso: 'Física',
        evaluacion: 'Laboratorio 2',
        nota: 3.8,
        fecha: '2024-03-16',
      },
      {
        id: 3,
        estudiante: 'María Rodríguez',
        curso: 'Química',
        evaluacion: 'Quiz 1',
        nota: 4.2,
        fecha: '2024-03-14',
      },
      {
        id: 4,
        estudiante: 'Pedro Martínez',
        curso: 'Programación',
        evaluacion: 'Proyecto',
        nota: 4.8,
        fecha: '2024-03-17',
      },
      {
        id: 5,
        estudiante: 'Ana García',
        curso: 'Física',
        evaluacion: 'Parcial 1',
        nota: 4.0,
        fecha: '2024-03-18',
      },
    ];
    this.notasFiltradas = [...this.notas];
  }

  filtrarNotas() {
    if (this.cursoFiltro) {
      this.notasFiltradas = this.notas.filter(
        (nota) => nota.curso === this.cursoFiltro
      );
    } else {
      this.notasFiltradas = [...this.notas];
    }
  }

  agregarNota() {
    alert('Funcionalidad para agregar nueva nota');
  }

  getNotaColor(nota: number): string {
    if (nota >= 4.5) return 'success';
    if (nota >= 3.5) return 'warning';
    return 'danger';
  }

  // Métodos solo para admin
  calcularPromedio(): string {
    const total = this.notas.reduce((sum, nota) => sum + nota.nota, 0);
    return (total / this.notas.length).toFixed(2);
  }

  contarNotasAltas(): number {
    return this.notas.filter((nota) => nota.nota >= 4.0).length;
  }
}
