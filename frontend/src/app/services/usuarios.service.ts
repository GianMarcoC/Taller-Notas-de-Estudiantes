import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  role?: string;        // alias para frontend
  ultimoAcceso?: string;
  estado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private apiUrl = 'http://ec2-3-145-217-121.us-east-2.compute.amazonaws.com:8000/usuarios'; // ✅ tu endpoint del backend

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Obtener lista de usuarios
  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Eliminar usuario
  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
