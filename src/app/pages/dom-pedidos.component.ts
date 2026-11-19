import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '../store.service';
import { EventoPedido, PedidoEstadoObservable, PedidoObserver } from '../patrones/pedido-estado.observable';

@Component({
  selector: 'app-dom-pedidos',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Mis entregas</h1>
    @if (aviso()) { <div class="okmsg">🔔 {{ aviso() }}</div> }
    @if (lista().length === 0) {
      <div class="card empty">No tienes pedidos asignados por ahora.</div>
    }
    @for (p of lista(); track p.id) {
      <div class="card row between">
        <div>
          <b>Pedido #{{ p.id }}</b> <span class="badge {{ store.estadoClase(p.estado) }}">{{ p.estado }}</span><br>
          <span class="hint">{{ p.fecha | date: 'dd/MM HH:mm' }} · {{ p.direccion }}</span>
        </div>
        <a class="btn btn-sm btn-primary" [routerLink]="['/domiciliario/pedidos', p.id]">Ver detalle</a>
      </div>
    }
  `,
})
export class DomPedidosComponent implements PedidoObserver {
  store = inject(Store);
  aviso = signal('');

  constructor() {
    // Observer: el domiciliario se entera cuando le asignan un pedido.
    inject(PedidoEstadoObservable).suscribir(this, inject(DestroyRef));
  }

  onPedidoCambio(e: EventoPedido) {
    const dom = this.store.domiciliarioActual();
    if (dom && e.tipo === 'asignado' && e.domiciliarioId === dom.id) this.aviso.set(`Nuevo pedido asignado: #${e.pedidoId}.`);
  }

  // Solo los pedidos asignados al domiciliario actual.
  lista = computed(() => {
    const dom = this.store.domiciliarioActual();
    return this.store.pedidos()
      .filter((p) => !!dom && p.domiciliarioId === dom.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  });
}
