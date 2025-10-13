import { Component, OnInit } from '@angular/core';
import {
  EstudiantesService,
  Estudiante,
} from '../../services/estudiantes.service';
import { AuthService } from '../../services/auth.service';
import {
  AlertController,
  IonicModule,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-estudiantes',
  templateUrl: './estudiantes.page.html',
  styleUrls: ['./estudiantes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class EstudiantesPage implements OnInit {
  estudiantes: Estudiante[] = [];
  user: any = null;

  constructor(
    private estudiantesService: EstudiantesService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.user = this.authService.getCurrentUser();
    await this.cargarEstudiantes();
  }

  async cargarEstudiantes() {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando estudiantes...',
    });
    await loading.present();

    this.estudiantesService.obtenerEstudiantes().subscribe({
      next: async (data) => {
        this.estudiantes = data;
        console.log('✅ Estudiantes cargados:', data);
        await loading.dismiss();
      },
      error: async (err) => {
        console.error('❌ Error al cargar estudiantes:', err);
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo cargar la lista de estudiantes.',
          buttons: ['OK'],
        });
        await alert.present();
      },
    });
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo':
        return 'success';
      case 'inactivo':
        return 'warning';
      case 'retirado':
        return 'danger';
      default:
        return 'medium';
    }
  }

  nuevoEstudiante() {
    console.log(
      '➕ Nuevo estudiante (pendiente de implementar modal/formulario)'
    );
  }

  editarEstudiante(estudiante: Estudiante) {
    console.log('✏️ Editar estudiante:', estudiante);
  }

  async eliminarEstudiante(estudiante: Estudiante) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Eliminar al estudiante ${estudiante.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.estudiantesService
              .eliminarEstudiante(estudiante.id)
              .subscribe({
                next: () => {
                  this.estudiantes = this.estudiantes.filter(
                    (e) => e.id !== estudiante.id
                  );
                },
                error: (err) =>
                  console.error('Error al eliminar estudiante:', err),
              });
          },
        },
      ],
    });
    await alert.present();
  }
}
