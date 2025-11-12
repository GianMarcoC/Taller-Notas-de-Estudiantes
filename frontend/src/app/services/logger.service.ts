import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;

  info(message: string, data?: any): void {
    if (!this.isProduction) {
      console.info(`ℹ️ ${message}`, this.sanitize(data));
    }
  }

  warn(message: string, data?: any): void {
    console.warn(`⚠️ ${message}`, this.sanitize(data));
  }

  error(message: string, error?: any): void {
    console.error(`❌ ${message}`, this.sanitizeError(error));
  }

  debug(message: string, data?: any): void {
    if (!this.isProduction) {
      console.debug(`🐛 ${message}`, this.sanitize(data));
    }
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitivePatterns = [
      'password', 'token', 'secret', 'key', 'auth',
      'email', 'phone', 'address', 'dni', 'credit'
    ];

    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const isSensitive = sensitivePatterns.some(pattern => 
            key.toLowerCase().includes(pattern)
          );
          
          if (isSensitive && obj[key]) {
            obj[key] = '***REDACTED***';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  private sanitizeError(error: any): any {
    if (!error) return error;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      };
    }

    if (error.response) {
      return {
        message: error.message,
        status: error.response.status,
        url: error.response.config?.url,
        data: this.sanitize(error.response.data)
      };
    }

    return this.sanitize(error);
  }
}