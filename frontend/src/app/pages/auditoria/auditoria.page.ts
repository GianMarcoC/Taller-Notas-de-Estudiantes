import { Component } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './auditoria.page.html',
  styleUrls: ['./auditoria.page.scss'],
})
export class AuditoriaPage {
  filtro = '';
  auditoria = [
    {
      accion: 'Creó usuario',
      usuario: 'Carlos Pérez',
      fecha: '2025-10-08',
      ip: '192.168.0.5',
    },
    {
      accion: 'Eliminó nota',
      usuario: 'Laura Gómez',
      fecha: '2025-10-07',
      ip: '192.168.0.10',
    },
    {
      accion: 'Editó estudiante',
      usuario: 'Pedro Ruiz',
      fecha: '2025-10-06',
      ip: '192.168.0.8',
    },
  ];

  constructor(private navCtrl: NavController) {}

  get auditoriaFiltrada() {
    const f = this.filtro.toLowerCase();
    return this.auditoria.filter(
      (log) =>
        log.accion.toLowerCase().includes(f) ||
        log.usuario.toLowerCase().includes(f) ||
        log.ip.includes(f)
    );
  }

  volverHome() {
    this.navCtrl.navigateBack('/home');
  }
}
