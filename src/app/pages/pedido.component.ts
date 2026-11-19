import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ItemPedido, Store } from '../store.service';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  template: `
    <h1>Mi pedido</h1>
    @if (msg) { <div class="error">{{ msg }}</div> }
    @if (store.carrito().length === 0) {
      <div class="card empty">
        Tu pedido está vacío.<br><a routerLink="/cliente/menu">Ver el menú</a>
      </div>
    } @else {
      <div class="card">
        <table class="tabla-compacta">
          <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr>
          @for (i of store.carrito(); track i.productoId) {
            <tr>
              <td>{{ i.nombre }}</td>
              <td>\${{ i.precio | number: '1.0-0' }}</td>
              <td>
                <input class="qty" type="number" min="1" [ngModel]="i.cantidad" (ngModelChange)="cambiar(i, $event)">
              </td>
              <td>\${{ i.precio * i.cantidad | number: '1.0-0' }}</td>
              <td><button class="btn btn-sm" (click)="store.quitarDelCarrito(i.productoId)">Quitar</button></td>
            </tr>
          }
        </table>
        <p class="hint" style="text-align:right;margin:.25rem 0">Subtotal: \${{ store.subtotalCarrito() | number: '1.0-0' }}</p>
        <p class="hint" style="text-align:right;margin:.25rem 0">Envío: \${{ store.envioCarrito() | number: '1.0-0' }}</p>
        <p class="total">Total: \${{ store.totalCarrito() | number: '1.0-0' }}</p>
        <div class="row" style="justify-content:flex-end">
          <a class="btn" routerLink="/cliente/menu">Seguir pidiendo</a>
          <button class="btn btn-primary" (click)="continuar()">Ver resumen</button>
        </div>
      </div>
    }
  `,
})
export class PedidoComponent {
  store = inject(Store);
  private router = inject(Router);
  msg = '';

  cambiar(item: ItemPedido, valor: unknown) {
    const n = Number(valor);
    if (!Number.isInteger(n) || n < 1) {
      this.msg = 'La cantidad debe ser un número entero mayor o igual a 1.';
      return;
    }
    this.msg = '';
    this.store.cambiarCantidad(item.productoId, n);
  }

  continuar() {
    this.router.navigate(['/cliente/resumen']);
  }
}
