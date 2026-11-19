import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '../store.service';
import { estadoDe } from '../patrones/estado-pedido';

@Component({
  selector: 'app-dom-detalle',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  template: `
    <a routerLink="/domiciliario/pedidos">← Volver a mis entregas</a>
    @if (pedido(); as p) {
      <div class="card" style="margin-top:1rem">
        <div class="row between">
          <h1 style="margin:0">Pedido #{{ p.id }}</h1>
          <span class="badge {{ store.estadoClase(p.estado) }}">{{ p.estado }}</span>
        </div>
        <h3 style="margin-top:1rem">Cliente</h3>
        <p>{{ p.clienteNombre }} · {{ p.clienteTelefono || 'Sin teléfono registrado' }}</p>
        <h3>Dirección de entrega</h3>
        <p>{{ p.direccion }}</p>
        <h3>Productos</h3>
        <ul>
          @for (i of p.items; track i.productoId) { <li>{{ i.cantidad }} × {{ i.nombre }}</li> }
        </ul>
        <p class="total">Total: \${{ store.totalPedido(p) | number: '1.0-0' }}</p>

        @if (accion(); as a) {
          <button class="btn btn-primary" (click)="store.avanzarEntrega(p.id)">{{ a.texto }}</button>
        } @else if (p.estado === 'Entregado') {
          <div class="okmsg">Entrega completada.</div>
        }
      </div>
    } @else {
      <div class="card empty" style="margin-top:1rem">Este pedido no está asignado a ti.</div>
    }
  `,
})
export class DomDetalleComponent {
  store = inject(Store);
  private id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  // Solo se ve si está asignado a este domiciliario.
  pedido = computed(() => {
    const dom = this.store.domiciliarioActual();
    return this.store.pedidos().find((p) => p.id === this.id && !!dom && p.domiciliarioId === dom.id) ?? null;
  });
  accion = computed(() => {
    const p = this.pedido();
    return p ? estadoDe(p.estado).accionDomiciliario() : null; // State
  });
}
