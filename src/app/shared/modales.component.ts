import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Domiciliario, NuevaDireccion } from '../store.service';

/** Contenedor base de los modales. */
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="backdrop" (click)="cerrar.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>{{ titulo }}</h3>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() titulo = '';
  @Output() cerrar = new EventEmitter<void>();
}

/** Modales 3 y 4: confirmar cancelación de pedido / confirmar eliminación de producto. */
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [titulo]="titulo" (cerrar)="cancelar.emit()">
      <p>{{ mensaje }}</p>
      <div class="row" style="justify-content:flex-end">
        <button class="btn" (click)="cancelar.emit()">{{ textoCancelar }}</button>
        <button class="btn btn-danger" (click)="confirmar.emit()">{{ textoConfirmar }}</button>
      </div>
    </app-modal>
  `,
})
export class ConfirmModalComponent {
  @Input() titulo = '¿Estás seguro?';
  @Input() mensaje = '';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Volver';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}

/** Modal 1: seleccionar domiciliario (administrador). */
@Component({
  selector: 'app-asignar-modal',
  standalone: true,
  imports: [ModalComponent, FormsModule],
  template: `
    <app-modal titulo="Asignar domiciliario" (cerrar)="cancelar.emit()">
      @if (disponibles.length === 0) {
        <div class="empty">No hay domiciliarios disponibles en este momento.</div>
      } @else {
        @for (d of disponibles; track d.id) {
          <label class="row card" style="cursor:pointer">
            <input type="radio" name="dom" [value]="d.id" [(ngModel)]="elegido">
            <span><strong>{{ d.nombre }}</strong><br><span class="hint">{{ d.telefono }}</span></span>
          </label>
        }
      }
      <div class="row" style="justify-content:flex-end">
        <button class="btn" (click)="cancelar.emit()">Cancelar</button>
        <button class="btn btn-primary" [disabled]="elegido === null" (click)="confirmar()">Asignar</button>
      </div>
    </app-modal>
  `,
})
export class AsignarModalComponent {
  @Input() disponibles: Domiciliario[] = [];
  @Output() asignar = new EventEmitter<number>();
  @Output() cancelar = new EventEmitter<void>();
  elegido: number | null = null;

  confirmar() {
    if (this.elegido !== null) this.asignar.emit(this.elegido);
  }
}

/** Modal 2: formulario de dirección (cliente). */
@Component({
  selector: 'app-direccion-modal',
  standalone: true,
  imports: [ModalComponent, FormsModule],
  template: `
    <app-modal titulo="Nueva dirección" (cerrar)="cancelar.emit()">
      <label class="field">Etiqueta (Casa, Oficina…)<input [(ngModel)]="etiqueta" placeholder="Casa"></label>
      <label class="field">Dirección *<input [(ngModel)]="direccion" placeholder="Cra 45 # 10-20, Apto 301"></label>
      <label class="field">Ciudad *<input [(ngModel)]="ciudad" placeholder="Medellín"></label>
      <label class="field">Referencia<input [(ngModel)]="referencia" placeholder="Portería azul"></label>
      <label class="row" style="margin-bottom:.75rem"><input type="checkbox" [(ngModel)]="principal"> Usar como dirección principal</label>
      @if (error) { <div class="error">{{ error }}</div> }
      <div class="row" style="justify-content:flex-end">
        <button class="btn" (click)="cancelar.emit()">Cancelar</button>
        <button class="btn btn-primary" (click)="guardar()">Guardar</button>
      </div>
    </app-modal>
  `,
})
export class DireccionModalComponent {
  @Output() guardada = new EventEmitter<NuevaDireccion>();
  @Output() cancelar = new EventEmitter<void>();
  etiqueta = '';
  direccion = '';
  ciudad = '';
  referencia = '';
  principal = false;
  error = '';

  guardar() {
    if (!this.direccion.trim() || !this.ciudad.trim()) {
      this.error = 'La dirección y la ciudad son obligatorias.';
      return;
    }
    this.guardada.emit({
      etiqueta: this.etiqueta.trim() || 'Dirección', direccion: this.direccion.trim(),
      ciudad: this.ciudad.trim(), referencia: this.referencia.trim(), principal: this.principal,
    });
  }
}
