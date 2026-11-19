import { Component, inject } from '@angular/core';
import { Store, NuevaDireccion } from '../store.service';
import { DireccionModalComponent } from '../shared/modales.component';

@Component({
  selector: 'app-direcciones',
  standalone: true,
  imports: [DireccionModalComponent],
  template: `
    <div class="row between">
      <h1>Mis direcciones</h1>
      <button class="btn btn-primary" (click)="modal = true">+ Nueva dirección</button>
    </div>
    @if (store.direccionesCliente().length === 0) {
      <div class="card empty">No tienes direcciones registradas.</div>
    }
    @for (d of store.direccionesCliente(); track d.id) {
      <div class="card row between">
        <div>
          <b>{{ d.etiqueta }}</b>
          @if (d.principal) { <span class="badge info">Principal</span> }
          <br>{{ d.direccion }}, {{ d.ciudad }}
          @if (d.referencia) { <br><span class="hint">Ref.: {{ d.referencia }}</span> }
        </div>
        @if (!d.principal) {
          <button class="btn btn-sm" (click)="store.marcarPrincipal(d.id)">Marcar como principal</button>
        }
      </div>
    }
    @if (modal) {
      <app-direccion-modal (guardada)="guardar($event)" (cancelar)="modal = false"></app-direccion-modal>
    }
  `,
})
export class DireccionesComponent {
  store = inject(Store);
  modal = false;

  guardar(d: NuevaDireccion) {
    this.store.agregarDireccion(d);
    this.modal = false;
  }
}
