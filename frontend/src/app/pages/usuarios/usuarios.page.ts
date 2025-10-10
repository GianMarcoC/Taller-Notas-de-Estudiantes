import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

interface UsuarioSistema {
  id: number;
  nombre: string;
  email: string;
  role: string;
  ultimoAcceso: string;
  estado: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class UsuariosPage implements OnInit {
  user: User | null = null;
  usuarios: UsuarioSistema[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    // Datos de ejemplo mejorados
    this.usuarios = [
      {
        id: 1,
        nombre: 'Administrador Principal',
        email: 'admin@sistema.com',
        role: 'admin',
        ultimoAcceso: '2024-03-20 14:30',
        estado: 'Activo',
      },
      {
        id: 2,
        nombre: 'Profesor Matemáticas',
        email: 'profesor.math@sistema.com',
        role: 'profesor',
        ultimoAcceso: '2024-03-19 10:15',
        estado: 'Activo',
      },
      {
        id: 3,
        nombre: 'Ana García López',
        email: 'ana.estudiante@sistema.com',
        role: 'estudiante',
        ultimoAcceso: '2024-03-20 09:45',
        estado: 'Activo',
      },
      {
        id: 4,
        nombre: 'Carlos Rodríguez',
        email: 'carlos.estudiante@sistema.com',
        role: 'estudiante',
        ultimoAcceso: '2024-03-18 16:20',
        estado: 'Activo',
      },
      {
        id: 5,
        nombre: 'Profesor Física',
        email: 'profesor.fisica@sistema.com',
        role: 'profesor',
        ultimoAcceso: '2024-03-17 11:30',
        estado: 'Inactivo',
      },
    ];
  }

  nuevoUsuario() {
    alert('Funcionalidad para agregar nuevo usuario - Próximamente');
  }

  editarUsuario(usuario: UsuarioSistema) {
    alert(`Editando usuario: ${usuario.nombre} - Próximamente`);
  }

  eliminarUsuario(usuario: UsuarioSistema) {
    if (confirm(`¿Estás seguro de eliminar al usuario: ${usuario.nombre}?`)) {
      this.usuarios = this.usuarios.filter((u) => u.id !== usuario.id);
    }
  }

  contarUsuarios(): number {
    return this.usuarios.length;
  }

  contarPorRol(rol: string): number {
    return this.usuarios.filter((user) => user.role === rol).length;
  }

  getIconoPorRol(rol: string): string {
    switch (rol) {
      case 'admin':
        return 'shield';
      case 'profesor':
        return 'person';
      case 'estudiante':
        return 'school';
      default:
        return 'person';
    }
  }

  getColorPorRol(rol: string): string {
    switch (rol) {
      case 'admin':
        return 'danger';
      case 'profesor':
        return 'warning';
      case 'estudiante':
        return 'success';
      default:
        return 'primary';
    }
  }
}
