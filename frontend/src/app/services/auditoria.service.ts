import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface LogAuditoria {
  id: number;
  accion: string;
  usuario: string;
  fecha: string;
  ip: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {
  private apiUrl = 'http://18.224.150.117:8000/auditoria/';

  constructor(private http: HttpClient, private authService: AuthService) {}

  obtenerRegistros(): Observable<LogAuditoria[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<LogAuditoria[]>(this.apiUrl, { headers });
  }
}
