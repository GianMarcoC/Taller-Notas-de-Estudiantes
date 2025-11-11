import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Estudiante {
  id: number;
  codigo_estudiante: string;
  nombre: string;
  email: string;
  curso: string;
  promedio: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstudiantesService {
  private apiUrl = 'http://18.224.150.117:8000/api/estudiantes';

  constructor(private http: HttpClient) {}

  obtenerEstudiantes(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(this.apiUrl);
  }

  eliminarEstudiante(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
