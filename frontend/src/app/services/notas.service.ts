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
  creado_en?: string;
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

  // ✅ Obtener todas las notas (para profesores/admin)
  obtenerNotasProfesor(): Observable<Nota[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notas/`).pipe(
      map((notas) => this.adaptarNotasBackend(notas)),
      catchError((error) => {
        console.error('Error obteniendo notas:', error);
        return of([]);
      })
    );
  }

  // ✅ Obtener mis notas (para estudiantes)
  obtenerMisNotas(): Observable<Nota[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notas/mias`).pipe(
      map((notas) => this.adaptarNotasBackend(notas)),
      catchError((error) => {
        console.error('Error obteniendo mis notas:', error);
        return of([]);
      })
    );
  }

  // ✅ Agregar nueva nota
  agregarNota(nota: Nota): Observable<Nota> {
    const notaBackend = {
      estudiante_id: nota.estudiante_id,
      asignatura: nota.asignatura,
      calificacion: nota.calificacion, // Ya está en escala 0-5
      periodo: nota.periodo,
      observaciones: nota.observaciones || '',
    };

    return this.http.post<any>(`${this.apiUrl}/notas/`, notaBackend).pipe(
      map((nuevaNota) => this.adaptarNotaBackend(nuevaNota)),
      catchError((error) => {
        console.error('Error creando nota:', error);
        throw error;
      })
    );
  }

  // ✅ Actualizar nota existente
  actualizarNota(id: number, nota: Nota): Observable<Nota> {
    const notaBackend = {
      estudiante_id: nota.estudiante_id,
      asignatura: nota.asignatura,
      calificacion: nota.calificacion,
      periodo: nota.periodo,
      observaciones: nota.observaciones || '',
    };

    // Nota: El endpoint PUT necesita ser implementado en el backend
    console.warn('Endpoint PUT no implementado en backend - usando simulación');
    return of(this.adaptarNotaBackend({ ...notaBackend, id }));
  }

  // ✅ Eliminar nota
  eliminarNota(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notas/${id}`).pipe(
      catchError((error) => {
        console.error('Error eliminando nota:', error);
        throw error;
      })
    );
  }

  // ✅ Adaptar notas del backend
  private adaptarNotasBackend(notas: any[]): Nota[] {
    return notas.map((nota) => this.adaptarNotaBackend(nota));
  }

  private adaptarNotaBackend(nota: any): Nota {
    return {
      id: nota.id,
      estudiante_id: nota.estudiante_id,
      estudiante_nombre:
        nota.estudiante_nombre || `Estudiante ${nota.estudiante_id}`,
      estudianteNombre:
        nota.estudiante_nombre || `Estudiante ${nota.estudiante_id}`,
      asignatura: nota.asignatura,
      cursoNombre: nota.asignatura,
      cursoId: this.obtenerCursoIdPorAsignatura(nota.asignatura),
      calificacion: parseFloat(nota.calificacion), // Ya viene en escala 0-5
      periodo: nota.periodo,
      tipoEvaluacion: 'Parcial',
      fecha: nota.creado_en ? new Date(nota.creado_en) : new Date(),
      observaciones: nota.observaciones || '',
      creado_por: nota.creado_por,
      creado_por_nombre: nota.creado_por_nombre,
      creado_en: nota.creado_en,
    };
  }

  private obtenerCursoIdPorAsignatura(asignatura: string): string {
    const mapeo: { [key: string]: string } = {
      matemáticas: '1',
      programación: '3',
      física: '9',
      matematicas: '1',
      programacion: '3',
    };

    const asignaturaLower = asignatura.toLowerCase();
    for (const key in mapeo) {
      if (asignaturaLower.includes(key)) {
        return mapeo[key];
      }
    }
    return '1';
  }

  // ✅ Obtener cursos del profesor
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

  // ✅ Obtener estudiantes (mejorado)
  obtenerEstudiantes(): Observable<any[]> {
    // En una implementación real, esto haría una llamada HTTP
    const estudiantes = [
      { id: 1, nombre: 'María García', codigo: 'EST001' },
      { id: 2, nombre: 'Carlos López', codigo: 'EST002' },
      { id: 3, nombre: 'Ana Martínez', codigo: 'EST003' },
    ];
    return of(estudiantes);
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
