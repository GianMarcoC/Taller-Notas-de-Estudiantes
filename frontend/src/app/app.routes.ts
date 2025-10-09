import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home', // 🔹 Para pruebas visuales, cambia a 'login' luego
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./pages/usuarios/usuarios.page').then((m) => m.UsuariosPage),
  },
  {
    path: 'estudiantes',
    loadComponent: () =>
      import('./pages/estudiantes/estudiantes.page').then(
        (m) => m.EstudiantesPage
      ),
  },
  {
    path: 'notas',
    loadComponent: () =>
      import('./pages/notas/notas.page').then((m) => m.NotasPage),
  },
  {
    path: 'mis-notas',
    loadComponent: () =>
      import('./pages/mis-notas/mis-notas.page').then((m) => m.MisNotasPage),
  },
  {
    path: 'auditoria',
    loadComponent: () =>
      import('./pages/auditoria/auditoria.page').then((m) => m.AuditoriaPage),
  },
];
