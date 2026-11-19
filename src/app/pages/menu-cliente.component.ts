import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Store, CATEGORIAS } from '../store.service';

@Component({
  selector: 'app-menu-cliente',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <h1>Menú</h1>
    <div class="chips">
      <button class="chip" [class.on]="categoria() === ''" (click)="categoria.set('')">Todo</button>
      @for (c of categorias; track c) {
        <button class="chip" [class.on]="categoria() === c" (click)="categoria.set(c)">{{ c }}</button>
      }
    </div>
    @if (msg) { <div class="okmsg">{{ msg }}</div> }
    @if (visibles().length === 0) {
      <div class="empty">No hay productos disponibles en esta categoría.</div>
    }
    <div class="grid">
      @for (p of visibles(); track p.id) {
        <div class="card">
          <div class="emoji">{{ p.emoji }}</div>
          <h3>{{ p.nombre }}</h3>
          <p class="hint">{{ p.descripcion }}</p>
          <div class="row between">
            <span class="price">\${{ p.precio | number: '1.0-0' }}</span>
            <button class="btn btn-primary btn-sm" (click)="agregar(p.id)">Agregar</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class MenuClienteComponent {
  private store = inject(Store);
  categorias = CATEGORIAS;
  categoria = signal('');
  msg = '';

  // Solo se listan productos disponibles (HU-4.1).
  visibles = computed(() =>
    this.store.productos().filter((p) => p.disponible && (!this.categoria() || p.categoria === this.categoria())));

  agregar(id: number) {
    const p = this.store.productos().find((x) => x.id === id);
    if (!p) return;
    const err = this.store.agregarAlCarrito(p);
    this.msg = err ?? `"${p.nombre}" agregado a tu pedido.`;
  }
}
