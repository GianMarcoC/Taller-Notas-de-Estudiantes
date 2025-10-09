import { Component } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mis-notas',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './mis-notas.page.html',
  styleUrls: ['./mis-notas.page.scss'],
})
export class MisNotasPage {
  misNotas = [
    { materia: 'Matemáticas', valor: 4.0 },
    { materia: 'Programación', valor: 4.5 },
    { materia: 'Física', valor: 3.8 },
  ];

  constructor(private navCtrl: NavController) {}

  // ✅ Calcula el promedio
  get promedio(): number {
    const total = this.misNotas.reduce((s, n) => s + n.valor, 0);
    return parseFloat((total / this.misNotas.length).toFixed(2));
  }

  // ✅ Permite volver al panel correcto según rol
  volverHome() {
    const rol = localStorage.getItem('rol');
    if (rol === 'estudiante') {
      this.navCtrl.navigateBack('/mis-notas'); // ya está aquí, pero evita error
    } else {
      this.navCtrl.navigateBack('/home');
    }
  }
}
