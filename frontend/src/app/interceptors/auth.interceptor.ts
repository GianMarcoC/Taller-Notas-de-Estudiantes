import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Obtener token del localStorage
    const token = localStorage.getItem('auth_token');

    // Clonar la request y agregar el header Authorization si existe token
    let authReq = req;
    if (token) {
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error) => {
        // Si el error es 401 (Unauthorized) y tenemos token, intentar refresh
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          token
        ) {
          return this.handle401Error(authReq, next);
        }

        // Para otros errores, simplemente los propagamos
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(
    request: HttpRequest<any>,
    token: string
  ): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Intentar refrescar el token
      return this.authService.refreshToken().pipe(
        switchMap((tokenResponse: any) => {
          this.isRefreshing = false;

          // Guardar el nuevo token
          localStorage.setItem('auth_token', tokenResponse.access_token);
          this.refreshTokenSubject.next(tokenResponse.access_token);

          // Reintentar la request original con el nuevo token
          return next.handle(
            this.addTokenHeader(request, tokenResponse.access_token)
          );
        }),
        catchError((error) => {
          this.isRefreshing = false;

          // Si el refresh falla, hacer logout
          this.authService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // Si ya se está refrescando, esperar a que termine
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addTokenHeader(request, token));
        })
      );
    }
  }
}
