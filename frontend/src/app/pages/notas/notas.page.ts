import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { NotasService, Nota } from '../../services/notas.service';
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
  cursoFiltro: string = '';
  estudiantes: any[] = [];
  tiposEvaluacion: string[] = [];
  busquedaEstudiante: string = '';
  fechaActual: string = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  constructor(
    private authService: AuthService,
    private notasService: NotasService,
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
    this.tiposEvaluacion = this.notasService.obtenerTiposEvaluacion();
  }

  cargarNotas() {
    this.notasService.obtenerNotasProfesor().subscribe((notas) => {
      this.notas = notas;
      this.notasFiltradas = [...this.notas];
    });
  }

  cargarCursos() {
    this.notasService.obtenerCursosProfesor().subscribe((cursos) => {
      this.cursos = cursos;
    });
  }

  cargarEstudiantes() {
    this.estudiantes = this.notasService.obtenerEstudiantes();
  }

  filtrarNotas() {
    if (this.cursoFiltro) {
      this.notasFiltradas = this.notas.filter(
        (nota) => nota.cursoId === this.cursoFiltro
      );
    } else {
      this.notasFiltradas = [...this.notas];
    }
  }

  formatearFecha(fecha: Date | undefined | null): string {
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
    if (nota >= 9.0) return 'Excelente';
    if (nota >= 7.0) return 'Bueno';
    if (nota >= 6.0) return 'Aprobado';
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
          placeholder: 'ID del estudiante (1 para María García)',
          value: '1',
          attributes: {
            required: 'true',
            min: '1',
            max: '1',
          },
        },
        {
          name: 'asignatura',
          type: 'text',
          placeholder: 'Materia/Asignatura (ej: Matemáticas, Programación)',
          attributes: {
            required: 'true',
          },
        },
        {
          name: 'calificacion',
          type: 'number',
          placeholder: 'Calificación (0.0 - 10.0)',
          min: 0,
          max: 10,
          attributes: {
            required: 'true',
            step: '0.1',
          },
        },
        {
          name: 'periodo',
          type: 'text',
          placeholder: 'Periodo académico',
          value: '2024-2',
          attributes: {
            required: 'true',
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
          text: 'Guardar Calificación',
          cssClass: 'btn-guardar',
          handler: (data) => {
            if (
              data.estudiante_id &&
              data.asignatura &&
              data.calificacion &&
              data.periodo
            ) {
              const nuevaNota: Nota = {
                estudiante_id: parseInt(data.estudiante_id),
                asignatura: data.asignatura,
                calificacion: parseFloat(data.calificacion),
                periodo: data.periodo,
              };

              this.notasService.agregarNota(nuevaNota).subscribe({
                next: () => {
                  this.mostrarMensaje(
                    '✅ Éxito',
                    'Calificación registrada correctamente'
                  );
                  this.cargarNotas();
                },
                error: (error) => {
                  this.mostrarMensaje(
                    '❌ Error',
                    'Error al registrar la calificación'
                  );
                  console.error('Error:', error);
                },
              });
              return true;
            }
            this.mostrarMensaje(
              '⚠️ Atención',
              'Complete todos los campos requeridos'
            );
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  async editarNota(nota: Nota) {
    const alert = await this.alertController.create({
      header: 'Editar Calificación',
      subHeader: `Estudiante: ${nota.estudianteNombre}`,
      inputs: [
        {
          name: 'calificacion',
          type: 'number',
          value: nota.calificacion,
          placeholder: 'Calificación (0.0 - 10.0)',
          min: 0,
          max: 10,
          attributes: {
            required: true,
            step: '0.1',
          },
        },
        {
          name: 'observaciones',
          type: 'textarea',
          value: nota.observaciones || '',
          placeholder: 'Observaciones o comentarios...',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Actualizar',
          handler: (data) => {
            if (data.calificacion) {
              const notaActualizada: Nota = {
                ...nota,
                calificacion: parseFloat(data.calificacion),
                observaciones: data.observaciones || '',
                fecha: new Date(),
              };

              this.notasService
                .actualizarNota(nota.id!, notaActualizada)
                .subscribe(() => {
                  this.mostrarMensaje(
                    'Éxito',
                    'Calificación actualizada correctamente'
                  );
                  this.cargarNotas();
                });
              return true;
            }
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  async eliminarNota(nota: Nota) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar la calificación de <strong>${
        nota.estudianteNombre
      }</strong>?<br><br>
               <strong>Detalles:</strong><br>
               • Curso: ${nota.cursoNombre}<br>
               • Calificación: ${nota.calificacion}<br>
               • Fecha: ${this.formatearFecha(nota.fecha)}`,
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
            this.notasService.eliminarNota(nota.id!).subscribe(() => {
              this.mostrarMensaje(
                'Éxito',
                'Calificación eliminada correctamente'
              );
              this.cargarNotas();
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
    if (nota >= 9.0) return 'success';
    if (nota >= 7.0) return 'warning';
    if (nota >= 6.0) return 'medium';
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
    return this.notasFiltradas.filter((nota) => nota.calificacion >= 7.0)
      .length;
  }
}
