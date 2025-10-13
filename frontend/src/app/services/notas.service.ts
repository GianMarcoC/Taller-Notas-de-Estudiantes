import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Nota {
  id?: number;
  estudiante_id: number;
  estudiante_nombre?: string;
  estudianteNombre?: string;
  asignatura: string;
  cursoNombre?: string;
  cursoId?: string;
  calificacion: number;
  periodo: string;
  tipoEvaluacion?: string;
  fecha?: Date;
  observaciones?: string;
  creado_por?: number;
  creado_por_nombre?: string;
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

  constructor(private http: HttpClient) {}

  // ✅ EL INTERCEPTOR AÑADE AUTOMÁTICAMENTE EL TOKEN
  obtenerNotasProfesor(): Observable<Nota[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notas/`).pipe(
      map((notas) => this.adaptarNotasBackend(notas)),
      catchError((error) => {
        console.error('Error obteniendo notas:', error);
        return of([]);
      })
    );
  }

  obtenerMisNotas(): Observable<Nota[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notas/mias`).pipe(
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
      periodo: nota.periodo,
    };

    return this.http.post<any>(`${this.apiUrl}/notas/`, notaBackend).pipe(
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

    console.warn('Endpoint PUT no implementado en backend');
    return of(this.adaptarNotaBackend({ ...notaBackend, id }));
  }

  eliminarNota(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notas/${id}`).pipe(
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
    return {
      id: nota.id,
      estudiante_id: nota.estudiante_id,
      estudiante_nombre: nota.estudiante_nombre,
      estudianteNombre: nota.estudiante_nombre,
      asignatura: nota.asignatura,
      cursoNombre: nota.asignatura,
      cursoId: this.obtenerCursoIdPorAsignatura(nota.asignatura),
      calificacion: this.convertirEscalaCalificacion(nota.calificacion),
      periodo: nota.periodo,
      tipoEvaluacion: 'Parcial',
      fecha: new Date(),
      observaciones: '',
      creado_por: nota.creado_por,
      creado_por_nombre: nota.creado_por_nombre,
    };
  }

  private convertirEscalaCalificacion(calificacion: number): number {
    return calificacion * 2;
  }

  private convertirCalificacionParaBackend(calificacion: number): number {
    return calificacion / 2;
  }

  private obtenerCursoIdPorAsignatura(asignatura: string): string {
    const mapeo: { [key: string]: string } = {
      matemáticas: '1',
      programación: '3',
      física: '9',
    };

    const asignaturaLower = asignatura.toLowerCase();
    for (const key in mapeo) {
      if (asignaturaLower.includes(key)) {
        return mapeo[key];
      }
    }
    return '1';
  }

  obtenerCursosProfesor(): Observable<Curso[]> {
    const cursos: Curso[] = [
      {
        id: '1',
        nombre: 'Matemáticas',
        descripcion: 'Álgebra, geometría y cálculo',
      },
      {
        id: '3',
        nombre: 'Programación',
        descripcion: 'Desarrollo de software',
      },
      {
        id: '9',
        nombre: 'Física',
        descripcion: 'Mecánica y electromagnetismo',
      },
    ];
    return of(cursos);
  }

  obtenerEstudiantes(): any[] {
    return [{ id: 1, nombre: 'María García', codigo: 'EST001' }];
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
