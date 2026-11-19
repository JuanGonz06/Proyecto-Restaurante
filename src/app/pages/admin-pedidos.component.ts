import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Estado, FLUJO, Pedido, Store } from '../store.service';
import { estadoDe } from '../patrones/estado-pedido';
import { EventoPedido, PedidoEstadoObservable, PedidoObserver } from '../patrones/pedido-estado.observable';
import { CalculadoraPedidoService } from '../patrones/calculadora-pedido.service';
import { AsignarModalComponent } from '../shared/modales.component';

@Component({
  selector: 'app-admin-pedidos',
  standalone: true,
  imports: [DatePipe, DecimalPipe, AsignarModalComponent],
  template: `
    <div class="row between">
      <h1>Pedidos</h1>
      <label class="hint">Estado
        <select (change)="filtro.set($any($event.target).value)">
          <option value="">Todos</option>
          @for (e of estados; track e) { <option [value]="e">{{ e }}</option> }
        </select>
      </label>
    </div>
    @if (aviso()) { <div class="okmsg">🔔 {{ aviso() }}</div> }
    @if (error) { <div class="error">{{ error }}</div> }
    <div class="card row between">
      <div><b>Política de envío</b><br><span class="hint">Se aplica a los pedidos nuevos. Los ya creados conservan su costo.</span></div>
      <select (change)="calculadora.cambiarEstrategia($any($event.target).value)">
        @for (e of calculadora.estrategias; track e.id) {
          <option [value]="e.id" [selected]="e.id === calculadora.estrategia().id">{{ e.etiqueta }}</option>
        }
      </select>
    </div>
    <div class="card">
      @if (lista().length === 0) {
        <div class="empty">No hay pedidos con ese filtro.</div>
      } @else {
        <table class="tabla-resp">
          <tr><th>#</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Domiciliario</th><th></th></tr>
          @for (p of lista(); track p.id) {
            <tr>
              <td data-label="Pedido">{{ p.id }}</td>
              <td data-label="Cliente">{{ p.clienteNombre }}</td>
              <td data-label="Fecha">{{ p.fecha | date: 'dd/MM HH:mm' }}</td>
              <td data-label="Total">\${{ store.totalPedido(p) | number: '1.0-0' }}</td>
              <td data-label="Estado"><span class="badge {{ store.estadoClase(p.estado) }}">{{ p.estado }}</span></td>
              <td data-label="Domiciliario">{{ nombreDom(p) }}</td>
              <td>
                @if (puedeAsignar(p)) {
                  <button class="btn btn-sm btn-primary" (click)="elegido = p">Asignar domiciliario</button>
                }
              </td>
            </tr>
          }
        </table>
      }
    </div>

    @if (elegido) {
      <app-asignar-modal [disponibles]="disponibles()" (asignar)="asignar($event)" (cancelar)="elegido = null"></app-asignar-modal>
    }
  `,
})
export class AdminPedidosComponent implements PedidoObserver {
  store = inject(Store);
  calculadora = inject(CalculadoraPedidoService); // Context de la Strategy de envío
  aviso = signal('');

  constructor() {
    // Observer: el panel del administrador se entera de pedidos nuevos y cancelados.
    inject(PedidoEstadoObservable).suscribir(this, inject(DestroyRef));
  }

  onPedidoCambio(e: EventoPedido) {
    if (e.tipo === 'creado' || e.tipo === 'cancelado') this.aviso.set(e.mensaje);
  }
  estados: Estado[] = [...FLUJO, 'Cancelado'];
  filtro = signal('');
  elegido: Pedido | null = null;
  error = '';

  lista = computed(() => {
    const f = this.filtro();
    const todos = [...this.store.pedidos()].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return f ? todos.filter((p) => p.estado === f) : todos;
  });
  disponibles = computed(() => this.store.domiciliarios().filter((d) => d.disponible));

  puedeAsignar(p: Pedido) { return estadoDe(p.estado).puedeAsignarDomiciliario(); } // State
  nombreDom(p: Pedido) {
    return this.store.domiciliarios().find((d) => d.id === p.domiciliarioId)?.nombre ?? '—';
  }

  asignar(domId: number) {
    if (!this.elegido) return;
    this.error = this.store.asignarDomiciliario(this.elegido.id, domId) ?? '';
    this.elegido = null;
  }
}
