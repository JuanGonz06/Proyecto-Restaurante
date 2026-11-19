import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '../store.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="top">
      <strong>🍽️ Restaurante</strong>
      <nav>
        @for (l of links(); track l.to) {
          <a [routerLink]="l.to" routerLinkActive="active">{{ l.label }}</a>
        }
      </nav>
      <span class="grow"></span>
      <span class="hint">{{ store.usuario()?.nombre }} · {{ store.usuario()?.etiquetaRol }}</span>
      <button class="btn btn-sm" (click)="salir()">Salir</button>
    </header>
    <main class="page"><router-outlet></router-outlet></main>
  `,
})
export class ShellComponent {
  store = inject(Store);
  private router = inject(Router);

  links = computed(() => {
    const rol = this.store.usuario()?.rol;
    if (rol === 'cliente') {
      return [
        { to: '/cliente/menu', label: 'Menú' },
        { to: '/cliente/pedido', label: `Mi pedido (${this.store.cantidadCarrito()})` },
        { to: '/cliente/seguimiento', label: 'Seguimiento' },
        { to: '/cliente/historial', label: 'Historial' },
        { to: '/cliente/direcciones', label: 'Direcciones' },
        { to: '/cliente/perfil', label: 'Perfil' },
      ];
    }
    if (rol === 'administrador') {
      return [
        { to: '/admin/menu', label: 'Gestión del menú' },
        { to: '/admin/pedidos', label: 'Pedidos' },
      ];
    }
    return [{ to: '/domiciliario/pedidos', label: 'Mis entregas' }];
  });

  salir() {
    this.store.logout();
    this.router.navigate(['/login']);
  }
}
