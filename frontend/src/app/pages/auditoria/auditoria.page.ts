import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AuditoriaService,
  LogAuditoria,
} from '../../services/auditoria.service';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './auditoria.page.html',
  styleUrls: ['./auditoria.page.scss'],
})
export class AuditoriaPage implements OnInit {
  filtro = '';
  auditoria: LogAuditoria[] = [];

  constructor(
    private navCtrl: NavController,
    private auditoriaService: AuditoriaService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.cargarAuditoria();
  }

  cargarAuditoria() {
    this.auditoriaService.obtenerRegistros().subscribe({
      next: (data) => {
        this.logger.debug('Registros de auditoría cargados', { 
          count: data.length 
        });
        this.auditoria = data;
      },
      error: (err) => {
        this.logger.error('Error cargando auditoría', err);
        this.mostrarAlerta('Error', 'No tienes permisos o la sesión expiró');
      },
    });
  }

  get auditoriaFiltrada() {
    const f = this.filtro.toLowerCase();
    return this.auditoria.filter(
      (log) =>
        log.accion.toLowerCase().includes(f) ||
        log.usuario.toLowerCase().includes(f) ||
        log.ip.includes(f)
    );
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }

  volverHome() {
    this.navCtrl.navigateBack('/home');
  }
}