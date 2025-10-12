import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../services/auth.service';
import { NotasService, Nota, Curso } from '../../services/notas.service';
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
  cursos: Curso[] = [];
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
    this.estudiantes = [
      { id: '1', nombre: 'Ana García', email: 'ana.garcia@colegio.edu' },
      { id: '2', nombre: 'Carlos López', email: 'carlos.lopez@colegio.edu' },
      {
        id: '3',
        nombre: 'María Rodríguez',
        email: 'maria.rodriguez@colegio.edu',
      },
      { id: '4', nombre: 'Juan Pérez', email: 'juan.perez@colegio.edu' },
      {
        id: '5',
        nombre: 'Laura Martínez',
        email: 'laura.martinez@colegio.edu',
      },
      {
        id: '6',
        nombre: 'David Hernández',
        email: 'david.hernandez@colegio.edu',
      },
    ];
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

  // ✅ FUNCIÓN CORREGIDA - Ahora acepta Date | undefined
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
      header: '📚 Registrar Calificación',
      cssClass: 'formulario-calificacion',
      inputs: [
        {
          name: 'estudianteNombre',
          type: 'text',
          placeholder: 'Nombre del estudiante',
          attributes: {
            required: 'true',
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
          name: 'tipoEvaluacion',
          type: 'text',
          placeholder: 'Tipo de evaluación',
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
          placeholder: 'Periodo académico (ej: 2024-2)',
          value: '2024-2',
          attributes: {
            required: 'true',
          },
        },
        {
          name: 'observaciones',
          type: 'textarea',
          placeholder: 'Observaciones o comentarios (opcional)',
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
              data.estudianteNombre &&
              data.asignatura &&
              data.tipoEvaluacion &&
              data.calificacion &&
              data.periodo
            ) {
              const nuevaNota: Nota = {
                estudiante_id: this.generarIdEstudiante(data.estudianteNombre),
                estudianteNombre: data.estudianteNombre,
                asignatura: data.asignatura,
                cursoNombre: data.asignatura,
                cursoId: this.obtenerCursoId(data.asignatura),
                tipoEvaluacion: data.tipoEvaluacion,
                calificacion: parseFloat(data.calificacion),
                periodo: data.periodo,
                fecha: new Date(),
                observaciones: data.observaciones || '',
              };

              this.notasService.agregarNota(nuevaNota).subscribe(() => {
                this.mostrarMensaje(
                  '✅ Éxito',
                  'Calificación registrada correctamente'
                );
                this.cargarNotas();
              });
              return true;
            }
            this.mostrarMensaje(
              '❌ Error',
              'Por favor complete todos los campos requeridos'
            );
            return false;
          },
        },
      ],
    });

    await alert.present();
  }

  // Método auxiliar para generar ID de estudiante
  private generarIdEstudiante(nombre: string): string {
    return nombre.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  }

  // Método auxiliar para obtener cursoId
  private obtenerCursoId(asignatura: string): string {
    const mapeo: { [key: string]: string } = {
      matemáticas: '1',
      lengua: '2',
      ciencias: '3',
      sociales: '4',
      inglés: '5',
      física: '9',
      química: '10',
      biología: '11',
    };

    const asignaturaLower = asignatura.toLowerCase();
    for (const key in mapeo) {
      if (asignaturaLower.includes(key)) {
        return mapeo[key];
      }
    }
    return '1';
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
          name: 'tipoEvaluacion',
          type: 'text',
          value: nota.tipoEvaluacion,
          placeholder: 'Tipo de evaluación',
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
            if (data.calificacion && data.tipoEvaluacion) {
              const notaActualizada: Nota = {
                ...nota,
                calificacion: parseFloat(data.calificacion),
                tipoEvaluacion: data.tipoEvaluacion,
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
               • Evaluación: ${nota.tipoEvaluacion}<br>
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
