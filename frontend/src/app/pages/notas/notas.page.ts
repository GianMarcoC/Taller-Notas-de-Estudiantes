import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { NotasService, Nota } from '../../services/notas.service';
import { LoggerService } from '../../services/logger.service';
import { AlertController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  cursos: any[] = [];
  estudiantes: any[] = [];
  asignaturaFiltro: string = '';
  busquedaEstudiante: string = '';

  constructor(
    private authService: AuthService,
    private notasService: NotasService,
    private logger: LoggerService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.cargarNotas();
    this.cargarCursos();
    this.cargarEstudiantes();
  }

  cargarNotas() {
    this.notasService.obtenerNotasProfesor().subscribe({
      next: (notas) => {
        this.logger.debug('Notas cargadas', { 
          count: notas.length 
        });
        this.notas = notas;
        this.notasFiltradas = [...this.notas];
        // Enriquecer las notas con datos de estudiantes
        this.enriquecerNotasConDatos();
      },
      error: (error) => {
        this.logger.error('Error cargando notas', error);
        this.mostrarMensaje('Error', 'No se pudieron cargar las notas');
      },
    });
  }

  cargarCursos() {
    this.notasService.obtenerCursosProfesor().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
      },
      error: (error) => {
        this.logger.error('Error cargando cursos', error);
      },
    });
  }

  cargarEstudiantes() {
    this.notasService.obtenerEstudiantes().subscribe({
      next: (estudiantes) => {
        this.estudiantes = estudiantes;
        // Enriquecer las notas con datos de estudiantes
        this.enriquecerNotasConDatos();
      },
      error: (error) => {
        this.logger.error('Error cargando estudiantes', error);
      },
    });
  }

  // ✅ Enriquecer las notas con datos adicionales para la vista
  enriquecerNotasConDatos() {
    if (this.estudiantes.length === 0 || this.notas.length === 0) return;

    this.notas = this.notas.map((nota) => {
      const estudiante = this.estudiantes.find(
        (e) => e.id === nota.estudiante_id
      );
      return {
        ...nota,
        estudianteNombre: estudiante
          ? estudiante.nombre
          : `Estudiante ${nota.estudiante_id}`,
        cursoNombre: nota.asignatura,
        cursoId: nota.asignatura,
        fecha: nota.creado_en ? new Date(nota.creado_en) : new Date(),
        tipoEvaluacion: 'Examen',
      };
    });
    this.notasFiltradas = [...this.notas];
  }

  filtrarNotas() {
    if (this.asignaturaFiltro) {
      this.notasFiltradas = this.notas.filter(
        (nota) => nota.asignatura === this.asignaturaFiltro
      );
    } else {
      this.notasFiltradas = [...this.notas];
    }
  }

  formatearFecha(fecha: Date | string | undefined | null): string {
    if (!fecha) {
      return 'Fecha no disponible';
    }
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  getTotalRegistros(): number {
    return this.notasFiltradas.length;
  }

  trackByNotaId(index: number, nota: any): string {
    return nota.id || index.toString();
  }

  getNotaTexto(nota: number): string {
    // Escala 0-5
    if (nota >= 4.5) return 'Excelente';
    if (nota >= 4.0) return 'Muy Bueno';
    if (nota >= 3.5) return 'Bueno';
    if (nota >= 3.0) return 'Aprobado';
    return 'Reprobado';
  }

  async agregarNota() {
    const alert = await this.alertController.create({
      header: 'Registrar Nueva Calificación',
      cssClass: 'formulario-calificacion',
      inputs: [
        {
          name: 'estudiante_id',
          type: 'number',
          placeholder: 'ID del estudiante',
          min: 1,
          attributes: {
            required: 'true',
            pattern: '[0-9]*'
          },
        },
        {
          name: 'asignatura',
          type: 'text',
          placeholder: 'Materia/Asignatura',
          attributes: {
            required: 'true',
          },
        },
        {
          name: 'calificacion',
          type: 'number',
          placeholder: 'Calificación (0.0 - 5.0)',
          min: 0,
          max: 5,
          attributes: {
            required: 'true',
            step: '0.1',
            inputmode: 'decimal'
          },
        },
        {
          name: 'periodo',
          type: 'text',
          placeholder: 'Periodo (ej: 2024-2)',
          value: '2024-2',
          attributes: {
            required: 'true',
            pattern: '[0-9]{4}-[1-2]'
          },
        },
        {
          name: 'observaciones',
          type: 'textarea',
          placeholder: 'Observaciones (opcional)',
          attributes: {
            maxlength: '200'
          },
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'btn-cancelar',
        },
        {
          text: 'Guardar',
          cssClass: 'btn-guardar',
          handler: (data) => {
            this.guardarNuevaNota(data);
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  private async guardarNuevaNota(data: any) {
    if (
      !data.estudiante_id ||
      !data.asignatura ||
      !data.calificacion ||
      !data.periodo
    ) {
      this.mostrarMensaje('Atención', 'Complete todos los campos requeridos');
      return;
    }

    const calificacion = parseFloat(data.calificacion);

    // Validar que la calificación esté entre 0 y 5
    if (calificacion < 0 || calificacion > 5) {
      this.mostrarMensaje('Error', 'La calificación debe estar entre 0 y 5');
      return;
    }

    const nuevaNota: Nota = {
      estudiante_id: parseInt(data.estudiante_id),
      asignatura: data.asignatura,
      calificacion: calificacion,
      periodo: data.periodo,
      observaciones: data.observaciones || '',
    };

    this.notasService.agregarNota(nuevaNota).subscribe({
      next: () => {
        this.mostrarMensaje('Éxito', 'Calificación registrada correctamente');
        this.cargarNotas(); // Recargar la lista
      },
      error: (error) => {
        this.logger.error('Error registrando calificación', error);
        this.mostrarMensaje(
          'Error',
          'Error al registrar la calificación: ' + error.message
        );
      },
    });
  }

  async editarNota(nota: Nota) {
    const alert = await this.alertController.create({
      header: 'Editar Calificación',
      subHeader: `Estudiante: ${nota.estudianteNombre || 'N/A'}`,
      cssClass: 'formulario-calificacion',
      inputs: [
        {
          name: 'calificacion',
          type: 'number',
          value: nota.calificacion,
          placeholder: 'Calificación (0.0 - 5.0)',
          min: 0,
          max: 5,
          attributes: {
            required: true,
            step: '0.1'
          },
        },
        {
          name: 'observaciones',
          type: 'textarea',
          value: nota.observaciones || '',
          placeholder: 'Observaciones o comentarios...',
          attributes: {
            maxlength: '200'
          },
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'btn-cancelar',
        },
        {
          text: 'Actualizar',
          cssClass: 'btn-guardar',
          handler: (data) => {
            this.actualizarNotaExistente(nota, data);
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  private async actualizarNotaExistente(nota: Nota, data: any) {
    if (!data.calificacion) {
      this.mostrarMensaje('Error', 'La calificación es requerida');
      return;
    }

    const calificacion = parseFloat(data.calificacion);

    if (calificacion < 0 || calificacion > 5) {
      this.mostrarMensaje('Error', 'La calificación debe estar entre 0 y 5');
      return;
    }

    const notaActualizada: Nota = {
      ...nota,
      calificacion: calificacion,
      observaciones: data.observaciones || '',
    };

    this.notasService.actualizarNota(nota.id!, notaActualizada).subscribe({
      next: () => {
        this.mostrarMensaje('Éxito', 'Calificación actualizada correctamente');
        this.cargarNotas();
      },
      error: (error) => {
        this.logger.error('Error actualizando calificación', error);
        this.mostrarMensaje('Error', 'Error al actualizar la calificación');
      },
    });
  }

  async eliminarNota(nota: Nota) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar la calificación de <strong>${
        nota.estudianteNombre || 'estudiante'
      }</strong>?<br><br>
               <strong>Detalles:</strong><br>
               • Asignatura: ${nota.asignatura}<br>
               • Calificación: ${nota.calificacion}<br>
               • Periodo: ${nota.periodo}`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.notasService.eliminarNota(nota.id!).subscribe({
              next: () => {
                this.mostrarMensaje(
                  'Éxito',
                  'Calificación eliminada correctamente'
                );
                this.cargarNotas();
              },
              error: (error) => {
                this.logger.error('Error eliminando calificación', error);
                this.mostrarMensaje(
                  'Error',
                  'Error al eliminar la calificación'
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

  getNotaColor(nota: number): string {
    // Ajustado para escala de 0-5
    if (nota >= 4.5) return 'success';
    if (nota >= 4.0) return 'warning';
    if (nota >= 3.0) return 'medium';
    return 'danger';
  }

  calcularPromedio(): string {
    if (this.notasFiltradas.length === 0) return '0.00';
    const total = this.notasFiltradas.reduce(
      (sum, nota) => sum + nota.calificacion,
      0
    );
    return (total / this.notasFiltradas.length).toFixed(2);
  }

  contarNotasAltas(): number {
    // Ajustado para escala de 0-5 (notas altas >= 4.0)
    return this.notasFiltradas.filter((nota) => nota.calificacion >= 4.0)
      .length;
  }
}