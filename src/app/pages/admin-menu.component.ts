import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Producto, Store } from '../store.service';
import { ConfirmModalComponent } from '../shared/modales.component';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [DecimalPipe, RouterLink, ConfirmModalComponent],
  template: `
    <div class="row between">
      <h1>Gestión del menú</h1>
      <a class="btn btn-primary" routerLink="/admin/menu/nuevo">+ Nuevo producto</a>
    </div>
    <div class="card">
      @if (store.productos().length === 0) {
        <div class="empty">El menú está vacío.</div>
      } @else {
        <table>
          <tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Estado</th><th></th></tr>
          @for (p of store.productos(); track p.id) {
            <tr>
              <td>{{ p.emoji }} {{ p.nombre }}</td>
              <td>{{ p.categoria }}</td>
              <td>\${{ p.precio | number: '1.0-0' }}</td>
              <td>
                @if (p.disponible) { <span class="badge ok">Disponible</span> } @else { <span class="badge bad">No disponible</span> }
              </td>
              <td class="row">
                <a class="btn btn-sm" [routerLink]="['/admin/menu/editar', p.id]">Editar</a>
                <button class="btn btn-sm" (click)="store.alternarDisponibilidad(p.id)">
                  {{ p.disponible ? 'Marcar agotado' : 'Marcar disponible' }}
                </button>
                <button class="btn btn-sm btn-danger" (click)="porEliminar = p">Eliminar</button>
              </td>
            </tr>
          }
        </table>
      }
    </div>

    @if (porEliminar) {
      <app-confirm-modal
        titulo="Eliminar producto"
        [mensaje]="'¿Eliminar &quot;' + porEliminar.nombre + '&quot; del menú? Los pedidos anteriores conservan su registro.'"
        textoConfirmar="Eliminar" textoCancelar="Cancelar"
        (confirmar)="eliminar()" (cancelar)="porEliminar = null"></app-confirm-modal>
    }
  `,
})
export class AdminMenuComponent {
  store = inject(Store);
  porEliminar: Producto | null = null;

  eliminar() {
    if (this.porEliminar) this.store.eliminarProducto(this.porEliminar.id);
    this.porEliminar = null;
  }
}
