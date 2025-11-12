import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { UsuariosService, Usuario } from '../../services/usuarios.service';
import { LoggerService } from '../../services/logger.service';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class UsuariosPage implements OnInit {
  user: User | null = null;
  usuarios: Usuario[] = [];

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private alertController: AlertController,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.logger.debug('Usuarios cargados', { 
          count: data.length 
        });
        this.usuarios = data.map((u) => ({
          ...u,
          role: u.rol, // adaptación para el HTML
          ultimoAcceso: '2024-03-20 10:00', // opcional, hasta que tengas ese campo
          estado: 'Activo',
        }));
      },
      error: (error) => {
        this.logger.error('Error al cargar usuarios', error);
        this.mostrarMensaje('Error', 'No se pudieron cargar los usuarios');
      },
    });
  }

  async eliminarUsuario(usuario: Usuario) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Seguro que deseas eliminar a <strong>${usuario.nombre}</strong>?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.usuariosService.eliminarUsuario(usuario.id).subscribe({
              next: () => {
                this.mostrarMensaje(
                  'Éxito',
                  `Usuario ${usuario.nombre} eliminado correctamente`
                );
                this.cargarUsuarios();
              },
              error: (err) => {
                this.logger.error('Error eliminando usuario', err);
                this.mostrarMensaje(
                  'Error',
                  'No se pudo eliminar el usuario (verifica permisos o rol)'
                );
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async mostrarMensaje(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  contarUsuarios(): number {
    return this.usuarios.length;
  }

  contarPorRol(rol: string): number {
    return this.usuarios.filter((user) => user.rol === rol).length;
  }

  getIconoPorRol(rol?: string): string {
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

  getColorPorRol(rol?: string): string {
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

  nuevoUsuario() {
    this.mostrarMensaje(
      'Próximamente',
      'Función para agregar usuarios en desarrollo'
    );
  }

  editarUsuario(usuario: Usuario) {
    this.mostrarMensaje(
      'Próximamente',
      `Función para editar a ${usuario.nombre}`
    );
  }
}