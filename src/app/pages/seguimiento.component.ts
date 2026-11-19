import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FLUJO, Store } from '../store.service';
import { estadoDe } from '../patrones/estado-pedido';
import { EventoPedido, PedidoEstadoObservable, PedidoObserver } from '../patrones/pedido-estado.observable';
import { ConfirmModalComponent } from '../shared/modales.component';

@Component({
  selector: 'app-seguimiento',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, ConfirmModalComponent],
  template: `
    <h1>Seguimiento del pedido</h1>
    @if (aviso()) { <div class="okmsg">🔔 {{ aviso() }}</div> }

    @if (store.pedidosCliente().length === 0) {
      <div class="card empty">Aún no tienes pedidos. <a routerLink="/cliente/menu">Ir al menú</a></div>
    } @else {
      @if (noPermitido) {
        <div class="error">No tienes acceso a ese pedido. Te mostramos el más reciente.</div>
      }
      <label class="field" style="max-width:320px">Pedido
        <select [value]="pedido()?.id" (change)="elegir($any($event.target).value)">
          @for (p of store.pedidosCliente(); track p.id) {
            <option [value]="p.id" [selected]="p.id === pedido()?.id">#{{ p.id }} · {{ p.estado }}</option>
          }
        </select>
      </label>

      @if (pedido(); as p) {
        <div class="card">
          <div class="row between">
            <h3 style="margin:0">Pedido #{{ p.id }}</h3>
            <span class="badge {{ store.estadoClase(p.estado) }}">{{ p.estado }}</span>
          </div>
          <p class="hint">{{ p.fecha | date: 'dd/MM/yyyy HH:mm' }} · Entrega en {{ p.direccion }}</p>

          @if (p.estado === 'Cancelado') {
            <div class="error">Este pedido fue cancelado.</div>
          } @else {
            <div class="steps">
              @for (e of flujo; track e; let i = $index) {
                <div class="step" [class.done]="i < indice(p.estado)" [class.now]="i === indice(p.estado)">{{ e }}</div>
              }
            </div>
          }

          <p>
            <b>Domiciliario:</b>
            @if (domiciliario(); as d) { {{ d.nombre }} · {{ d.telefono }} } @else { <span class="hint">Aún sin asignar</span> }
          </p>

          <table>
            <tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr>
            @for (i of p.items; track i.productoId) {
              <tr><td>{{ i.nombre }}</td><td>{{ i.cantidad }}</td><td>\${{ i.precio * i.cantidad | number: '1.0-0' }}</td></tr>
            }
          </table>
          <p class="hint" style="text-align:right;margin:.25rem 0">Subtotal: \${{ store.subtotalPedido(p) | number: '1.0-0' }}</p>
          <p class="hint" style="text-align:right;margin:.25rem 0">Envío: \${{ p.envio | number: '1.0-0' }}</p>
          <p class="total">Total: \${{ store.totalPedido(p) | number: '1.0-0' }}</p>

          @if (error) { <div class="error">{{ error }}</div> }
          @if (p.estado !== 'Cancelado' && p.estado !== 'Entregado') {
            <p class="hint">
              <button class="btn btn-sm" (click)="store.simularAvance(p.id)">Demo: simular el siguiente paso</button>
              Solo para la demostración: hace lo que haría el administrador o el domiciliario y el seguimiento se actualiza solo.
            </p>
          }
          @if (puedeCancelar()) {
            <button class="btn btn-danger" (click)="confirmando = true">Cancelar pedido</button>
          } @else if (p.estado !== 'Cancelado' && p.estado !== 'Entregado') {
            <p class="hint">Este pedido ya no se puede cancelar porque dejó de estar pendiente.</p>
          }
        </div>
      }
    }

    @if (confirmando) {
      <app-confirm-modal
        titulo="Cancelar pedido"
        mensaje="¿Seguro que quieres cancelar este pedido? Esta acción no se puede deshacer."
        textoConfirmar="Sí, cancelar" textoCancelar="No, volver"
        (confirmar)="cancelar()" (cancelar)="confirmando = false"></app-confirm-modal>
    }
  `,
})
export class SeguimientoComponent implements PedidoObserver {
  store = inject(Store);
  aviso = signal('');
  private route = inject(ActivatedRoute);
  flujo = FLUJO;
  seleccion = signal<number | null>(null);
  noPermitido = false;
  confirmando = false;
  error = '';

  constructor() {
    // Observer: el seguimiento se suscribe a los cambios de estado de los pedidos del cliente.
    inject(PedidoEstadoObservable).suscribir(this, inject(DestroyRef));
    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (id) {
      // Solo se puede ver un pedido propio.
      if (this.store.pedidosCliente().some((p) => p.id === id)) this.seleccion.set(id);
      else this.noPermitido = true;
    }
  }

  pedido = computed(() => {
    const lista = this.store.pedidosCliente();
    const sel = this.seleccion();
    const mas = [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    return lista.find((p) => p.id === sel) ?? mas ?? null;
  });
  domiciliario = computed(() => {
    const id = this.pedido()?.domiciliarioId;
    return this.store.domiciliarios().find((d) => d.id === id) ?? null;
  });
  puedeCancelar = computed(() => {
    const p = this.pedido();
    return !!p && estadoDe(p.estado).puedeCancelar(); // State
  });

  onPedidoCambio(e: EventoPedido) {
    if (e.clienteEmail === this.store.usuario()?.email && e.tipo !== 'creado') this.aviso.set(e.mensaje);
  }

  indice(e: string) { return FLUJO.indexOf(e as (typeof FLUJO)[number]); }
  elegir(v: string) { this.seleccion.set(Number(v)); this.error = ''; }

  cancelar() {
    const p = this.pedido();
    this.confirmando = false;
    if (!p) return;
    this.error = this.store.cancelarPedido(p.id) ?? '';
  }
}
