import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CATEGORIAS, Store } from '../store.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h1>{{ id ? 'Editar producto' : 'Nuevo producto' }}</h1>
    <div class="card" style="max-width:520px">
      <label class="field">Nombre *<input [(ngModel)]="nombre"></label>
      <label class="field">Categoría *
        <select [(ngModel)]="categoria">
          @for (c of categorias; track c) { <option [value]="c">{{ c }}</option> }
        </select>
      </label>
      <label class="field">Descripción<input [(ngModel)]="descripcion"></label>
      <label class="field">Precio (COP) *<input type="number" min="1" [(ngModel)]="precio"></label>
      <label class="field">Emoji / imagen<input [(ngModel)]="emoji" maxlength="4"></label>
      <label class="row" style="margin-bottom:.75rem"><input type="checkbox" [(ngModel)]="disponible"> Disponible para pedir</label>
      @if (error) { <div class="error">{{ error }}</div> }
      <div class="row">
        <button class="btn btn-primary" (click)="guardar()">Guardar</button>
        <a class="btn" routerLink="/admin/menu">Cancelar</a>
      </div>
    </div>
  `,
})
export class ProductoFormComponent {
  private store = inject(Store);
  private router = inject(Router);
  categorias = CATEGORIAS;
  id: number | null = null;
  nombre = '';
  categoria = CATEGORIAS[0];
  descripcion = '';
  precio: number | null = null;
  emoji = '🍽️';
  disponible = true;
  error = '';

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    const p = id ? this.store.productos().find((x) => x.id === id) : undefined;
    if (p) {
      this.id = p.id;
      this.nombre = p.nombre;
      this.categoria = p.categoria;
      this.descripcion = p.descripcion;
      this.precio = p.precio;
      this.emoji = p.emoji;
      this.disponible = p.disponible;
    }
  }

  guardar() {
    if (!this.nombre.trim() || !this.categoria) {
      this.error = 'El nombre y la categoría son obligatorios.';
      return;
    }
    const precio = Number(this.precio);
    if (this.precio === null || String(this.precio).trim() === '' || !Number.isFinite(precio) || precio <= 0) {
      this.error = 'El precio debe ser un número mayor que cero.';
      return;
    }
    this.store.guardarProducto({
      id: this.id ?? undefined, nombre: this.nombre.trim(), categoria: this.categoria,
      descripcion: this.descripcion.trim(), precio, emoji: this.emoji || '🍽️', disponible: this.disponible,
    });
    this.router.navigate(['/admin/menu']);
  }
}
