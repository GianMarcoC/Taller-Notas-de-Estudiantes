import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Estudiante {
  id: number;
  codigo: string;
  nombre: string;
  curso: string;
  promedio: number;
  estado: string;
}

@Component({
  selector: 'app-estudiantes',
  templateUrl: './estudiantes.page.html',
  styleUrls: ['./estudiantes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EstudiantesPage implements OnInit {
  user: User | null = null;
  estudiantes: Estudiante[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.cargarEstudiantes();
  }

  cargarEstudiantes() {
    // Datos de ejemplo
    this.estudiantes = [
      { id: 1, codigo: '2024001', nombre: 'Ana García', curso: 'Matemáticas', promedio: 4.2, estado: 'Activo' },
      { id: 2, codigo: '2024002', nombre: 'Carlos López', curso: 'Física', promedio: 3.8, estado: 'Activo' },
      { id: 3, codigo: '2024003', nombre: 'María Rodríguez', curso: 'Química', promedio: 4.5, estado: 'Inactivo' },
      { id: 4, codigo: '2024004', nombre: 'Pedro Martínez', curso: 'Programación', promedio: 3.9, estado: 'Activo' }
    ];
  }

  nuevoEstudiante() {
    alert('Funcionalidad para agregar nuevo estudiante');
  }

  editarEstudiante(estudiante: Estudiante) {
    alert(`Editando estudiante: ${estudiante.nombre}`);
  }

  eliminarEstudiante(estudiante: Estudiante) {
    if (confirm(`¿Estás seguro de eliminar a ${estudiante.nombre}?`)) {
      this.estudiantes = this.estudiantes.filter(e => e.id !== estudiante.id);
    }
  }

  getEstadoColor(estado: string): string {
    return estado === 'Activo' ? 'success' : 'warning';
  }
}