import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '../store.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h1>Mi perfil</h1>
    <div class="card" style="max-width:480px">
      <label class="field">Correo<input [value]="store.usuario()?.email" disabled></label>
      <label class="field">Nombre *<input [(ngModel)]="nombre"></label>
      <label class="field">Teléfono<input [(ngModel)]="telefono" placeholder="3001234567"></label>
      @if (error) { <div class="error">{{ error }}</div> }
      @if (guardado) { <div class="okmsg">Cambios guardados.</div> }
      <div class="row">
        <button class="btn btn-primary" (click)="guardar()">Guardar</button>
        <button class="btn" (click)="descartar()">Descartar cambios</button>
      </div>
    </div>
  `,
})
export class PerfilComponent {
  store = inject(Store);
  nombre = this.store.usuario()?.nombre ?? '';
  telefono = this.store.usuario()?.telefono ?? '';
  error = '';
  guardado = false;

  guardar() {
    this.guardado = false;
    if (!this.nombre.trim()) { this.error = 'El nombre es obligatorio.'; return; }
    if (this.telefono.trim() && !/^\d{7,10}$/.test(this.telefono.trim())) {
      this.error = 'El teléfono debe tener entre 7 y 10 dígitos.';
      return;
    }
    this.error = '';
    this.store.actualizarPerfil(this.nombre, this.telefono);
    this.guardado = true;
  }

  descartar() {
    this.nombre = this.store.usuario()?.nombre ?? '';
    this.telefono = this.store.usuario()?.telefono ?? '';
    this.error = '';
    this.guardado = false;
  }
}
