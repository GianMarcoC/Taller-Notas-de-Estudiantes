import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Nota {
  id?: number;
  estudiante_id: string;
  estudianteNombre?: string;
  asignatura: string;
  cursoNombre?: string;
  cursoId?: string; // ✅ PROPIEDAD AGREGADA
  calificacion: number;
  periodo: string;
  tipoEvaluacion?: string;
  fecha?: Date;
  observaciones?: string;
  creado_por?: string;
}

export interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotasService {
  private apiUrl = 'http://localhost:8000';
  private authToken = localStorage.getItem('auth_token');

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.authToken}`,
    });
  }

  obtenerNotasProfesor(): Observable<Nota[]> {
    return this.http
      .get<Nota[]>(`${this.apiUrl}/notas/`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((notas) => this.adaptarNotasBackend(notas)),
        catchError((error) => {
          console.error('Error obteniendo notas:', error);
          return of([]);
        })
      );
  }

  obtenerMisNotas(): Observable<Nota[]> {
    return this.http
      .get<Nota[]>(`${this.apiUrl}/notas/mias`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((notas) => this.adaptarNotasBackend(notas)),
        catchError((error) => {
          console.error('Error obteniendo mis notas:', error);
          return of([]);
        })
      );
  }

  agregarNota(nota: Nota): Observable<Nota> {
    const notaBackend = {
      estudiante_id: nota.estudiante_id,
      asignatura: nota.asignatura,
      calificacion: this.convertirCalificacionParaBackend(nota.calificacion),
      periodo: this.obtenerPeriodoActual(),
    };

    return this.http
      .post<Nota>(`${this.apiUrl}/notas/`, notaBackend, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((nuevaNota) => this.adaptarNotaBackend(nuevaNota)),
        catchError((error) => {
          console.error('Error creando nota:', error);
          throw error;
        })
      );
  }

  actualizarNota(id: number, nota: Nota): Observable<Nota> {
    const notaBackend = {
      estudiante_id: nota.estudiante_id,
      asignatura: nota.asignatura,
      calificacion: this.convertirCalificacionParaBackend(nota.calificacion),
      periodo: nota.periodo,
    };

    console.warn('Endpoint de actualización no implementado en backend');
    return of(this.adaptarNotaBackend({ ...notaBackend, id }));
  }

  eliminarNota(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/notas/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error eliminando nota:', error);
          throw error;
        })
      );
  }

  private adaptarNotasBackend(notas: any[]): Nota[] {
    return notas.map((nota) => this.adaptarNotaBackend(nota));
  }

  private adaptarNotaBackend(nota: any): Nota {
    // Mapear asignatura a cursoId (puedes mejorar esta lógica)
    const cursoId = this.obtenerCursoIdPorAsignatura(nota.asignatura);

    return {
      id: nota.id,
      estudiante_id: nota.estudiante_id,
      estudianteNombre: this.obtenerNombreEstudiante(nota.estudiante_id),
      asignatura: nota.asignatura,
      cursoNombre: nota.asignatura,
      cursoId: cursoId, // ✅ ASIGNAMOS cursoId
      calificacion: this.convertirEscalaCalificacion(nota.calificacion),
      periodo: nota.periodo,
      tipoEvaluacion: 'Parcial',
      fecha: new Date(),
      observaciones: '',
      creado_por: nota.creado_por,
    };
  }

  // Método para mapear asignatura a cursoId
  private obtenerCursoIdPorAsignatura(asignatura: string): string {
    const mapeo: { [key: string]: string } = {
      Matemáticas: '1',
      'Lengua y Literatura': '2',
      'Ciencias Naturales': '3',
      'Ciencias Sociales': '4',
      Inglés: '5',
      Física: '9',
      Química: '10',
      Biología: '11',
    };
    return mapeo[asignatura] || '1'; // Default a '1' si no encuentra
  }

  private convertirEscalaCalificacion(calificacion: number): number {
    return calificacion * 2; // De 0-5 a 0-10
  }

  private convertirCalificacionParaBackend(calificacion: number): number {
    return calificacion / 2; // De 0-10 a 0-5
  }

  private obtenerPeriodoActual(): string {
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? '1' : '2';
    return `${year}-${semester}`;
  }

  private obtenerNombreEstudiante(estudianteId: string): string {
    const estudiantes: { [key: string]: string } = {
      '1': 'Ana García',
      '2': 'Carlos López',
      '3': 'María Rodríguez',
      '4': 'Juan Pérez',
    };
    return estudiantes[estudianteId] || 'Estudiante';
  }

  obtenerCursosProfesor(): Observable<Curso[]> {
    const cursos: Curso[] = [
      {
        id: '1',
        nombre: 'Matemáticas',
        descripcion: 'Álgebra, geometría y cálculo',
      },
      {
        id: '2',
        nombre: 'Lengua y Literatura',
        descripcion: 'Gramática y análisis literario',
      },
      {
        id: '3',
        nombre: 'Ciencias Naturales',
        descripcion: 'Biología, química y física',
      },
      {
        id: '4',
        nombre: 'Ciencias Sociales',
        descripcion: 'Historia y geografía',
      },
      { id: '5', nombre: 'Inglés', descripcion: 'Idioma extranjero' },
      {
        id: '9',
        nombre: 'Física',
        descripcion: 'Mecánica y electromagnetismo',
      },
      {
        id: '10',
        nombre: 'Química',
        descripcion: 'Elementos y reacciones químicas',
      },
      { id: '11', nombre: 'Biología', descripcion: 'Anatomía y ecología' },
    ];
    return of(cursos);
  }

  obtenerTiposEvaluacion(): string[] {
    return [
      'Parcial',
      'Quiz',
      'Laboratorio',
      'Proyecto',
      'Tarea',
      'Examen Final',
    ];
  }
}
