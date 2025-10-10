import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [RoleGuard],
    data: { roles: ['estudiante', 'profesor', 'admin'] },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auditoria',
    loadComponent: () =>
      import('./pages/auditoria/auditoria.page').then((m) => m.AuditoriaPage),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'estudiantes',
    loadComponent: () =>
      import('./pages/estudiantes/estudiantes.page').then(
        (m) => m.EstudiantesPage
      ),
    canActivate: [RoleGuard],
    data: { roles: ['profesor', 'admin'] },
  },
  {
    path: 'mis-notas',
    loadComponent: () =>
      import('./pages/mis-notas/mis-notas.page').then((m) => m.MisNotasPage),
    canActivate: [RoleGuard],
    data: { roles: ['estudiante'] },
  },
  {
    path: 'notas',
    loadComponent: () =>
      import('./pages/notas/notas.page').then((m) => m.NotasPage),
    canActivate: [RoleGuard],
    data: { roles: ['profesor', 'admin'] },
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./pages/usuarios/usuarios.page').then((m) => m.UsuariosPage),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
