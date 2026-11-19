import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '../store.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="row between">
      <h1>Historial de pedidos</h1>
      <label class="hint">Ordenar por
        <select (change)="orden.set($any($event.target).value)">
          <option value="reciente">Más recientes primero</option>
          <option value="antiguo">Más antiguos primero</option>
        </select>
      </label>
    </div>

    @if (lista().length === 0) {
      <div class="card empty">Todavía no has hecho pedidos. <a routerLink="/cliente/menu">Ir al menú</a></div>
    }
    @for (p of lista(); track p.id) {
      <div class="card">
        <div class="row between">
          <b>Pedido #{{ p.id }}</b>
          <span class="badge {{ store.estadoClase(p.estado) }}">{{ p.estado }}</span>
        </div>
        <p class="hint">{{ p.fecha | date: 'dd/MM/yyyy HH:mm' }}</p>
        <ul>
          @for (i of p.items; track i.productoId) {
            <li>{{ i.cantidad }} × {{ i.nombre }} — \${{ i.precio * i.cantidad | number: '1.0-0' }}</li>
          }
        </ul>
        <div class="row between">
          <b class="price">Total \${{ store.totalPedido(p) | number: '1.0-0' }}</b>
          <a class="btn btn-sm" routerLink="/cliente/seguimiento" [queryParams]="{ id: p.id }">Ver seguimiento</a>
        </div>
      </div>
    }
  `,
})
export class HistorialComponent {
  store = inject(Store);
  orden = signal<'reciente' | 'antiguo'>('reciente');

  lista = computed(() => {
    const asc = [...this.store.pedidosCliente()].sort((a, b) => a.fecha.localeCompare(b.fecha));
    return this.orden() === 'reciente' ? asc.reverse() : asc;
  });
}
