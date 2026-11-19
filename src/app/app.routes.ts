import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Rol, Store } from './store.service';
import { ShellComponent } from './shared/shell.component';
import { LoginComponent } from './pages/login.component';
import { RegistroComponent } from './pages/registro.component';
import { RecuperarComponent } from './pages/recuperar.component';
import { MenuClienteComponent } from './pages/menu-cliente.component';
import { PedidoComponent } from './pages/pedido.component';
import { ResumenComponent } from './pages/resumen.component';
import { SeguimientoComponent } from './pages/seguimiento.component';
import { HistorialComponent } from './pages/historial.component';
import { PerfilComponent } from './pages/perfil.component';
import { DireccionesComponent } from './pages/direcciones.component';
import { AdminMenuComponent } from './pages/admin-menu.component';
import { ProductoFormComponent } from './pages/producto-form.component';
import { AdminPedidosComponent } from './pages/admin-pedidos.component';
import { DomPedidosComponent } from './pages/dom-pedidos.component';
import { DomDetalleComponent } from './pages/dom-detalle.component';

const rolGuard = (rol: Rol): CanActivateFn => () => {
  const store = inject(Store);
  const router = inject(Router);
  return store.usuario()?.rol === rol ? true : router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'recuperar', component: RecuperarComponent },
  {
    path: 'cliente', component: ShellComponent, canActivate: [rolGuard('cliente')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'menu' },
      { path: 'menu', component: MenuClienteComponent },
      { path: 'pedido', component: PedidoComponent },
      { path: 'resumen', component: ResumenComponent },
      { path: 'seguimiento', component: SeguimientoComponent },
      { path: 'historial', component: HistorialComponent },
      { path: 'direcciones', component: DireccionesComponent },
      { path: 'perfil', component: PerfilComponent },
    ],
  },
  {
    path: 'admin', component: ShellComponent, canActivate: [rolGuard('administrador')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'menu' },
      { path: 'menu', component: AdminMenuComponent },
      { path: 'menu/nuevo', component: ProductoFormComponent },
      { path: 'menu/editar/:id', component: ProductoFormComponent },
      { path: 'pedidos', component: AdminPedidosComponent },
    ],
  },
  {
    path: 'domiciliario', component: ShellComponent, canActivate: [rolGuard('domiciliario')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'pedidos' },
      { path: 'pedidos', component: DomPedidosComponent },
      { path: 'pedidos/:id', component: DomDetalleComponent },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
