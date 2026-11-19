import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store, NuevaDireccion } from '../store.service';
import { DireccionModalComponent } from '../shared/modales.component';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink, DireccionModalComponent],
  template: `
    <h1>Resumen del pedido</h1>
    <div class="card">
      @if (store.carrito().length === 0) {
        <div class="empty">No hay productos en tu pedido. <a routerLink="/cliente/menu">Ir al menú</a></div>
      } @else {
        <table>
          <tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr>
          @for (i of store.carrito(); track i.productoId) {
            <tr><td>{{ i.nombre }}</td><td>{{ i.cantidad }}</td><td>\${{ i.precio * i.cantidad | number: '1.0-0' }}</td></tr>
          }
        </table>
        <p class="hint" style="text-align:right;margin:.25rem 0">Subtotal: \${{ store.subtotalCarrito() | number: '1.0-0' }}</p>
        <p class="hint" style="text-align:right;margin:.25rem 0">Envío: \${{ store.envioCarrito() | number: '1.0-0' }}</p>
        <p class="total">Total: \${{ store.totalCarrito() | number: '1.0-0' }}</p>
        <a routerLink="/cliente/pedido">Editar pedido</a>
      }
    </div>

    <div class="card">
      <div class="row between"><h3 style="margin:0">Dirección de entrega</h3>
        <button class="btn btn-sm" (click)="modal = true">+ Nueva dirección</button></div>
      @if (store.direccionesCliente().length === 0) {
        <p class="hint">Aún no tienes direcciones. Registra una para poder confirmar el pedido.</p>
      }
      @for (d of store.direccionesCliente(); track d.id) {
        <label class="row" style="margin:.5rem 0">
          <input type="radio" name="dir" [value]="d.id" [ngModel]="elegida ?? principalId()" (ngModelChange)="elegida = $event">
          <span><b>{{ d.etiqueta }}</b>@if (d.principal) { <span class="badge info">Principal</span> }<br>
            <span class="hint">{{ d.direccion }}, {{ d.ciudad }}</span></span>
        </label>
      }
    </div>

    @if (error) { <div class="error">{{ error }}</div> }
    <div class="row" style="justify-content:flex-end">
      <button class="btn btn-primary" (click)="confirmar()">Confirmar pedido</button>
    </div>

    @if (modal) {
      <app-direccion-modal (guardada)="guardarDireccion($event)" (cancelar)="modal = false"></app-direccion-modal>
    }
  `,
})
export class ResumenComponent {
  store = inject(Store);
  private router = inject(Router);
  elegida: number | null = null;
  modal = false;
  error = '';

  principalId(): number | null {
    const l = this.store.direccionesCliente();
    return (l.find((d) => d.principal) ?? l[0])?.id ?? null;
  }

  guardarDireccion(d: NuevaDireccion) {
    this.store.agregarDireccion(d);
    this.modal = false;
    this.elegida = null;
  }

  confirmar() {
    const r = this.store.confirmarPedido(this.elegida ?? this.principalId());
    if (r.error) {
      this.error = r.error;
      return;
    }
    this.router.navigate(['/cliente/seguimiento'], { queryParams: { id: r.id } });
  }
}
