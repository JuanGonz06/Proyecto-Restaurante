import { Injectable, computed, inject, signal } from '@angular/core';
import type { Direccion, ItemPedido, Pedido, Producto } from '../store.service';
import { CalculadoraPedidoService } from './calculadora-pedido.service';
import { PedidoBuilder } from './pedido.builder';
import type { Usuario } from './usuario.factory';

/**
 * Director del patrón Builder: conoce el orden en que hay que llamar al PedidoBuilder
 * para armar un pedido completo a partir del carrito. Además administra el carrito (HU-1.1, 1.2, 1.5).
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private calculadora = inject(CalculadoraPedidoService);

  readonly items = signal<ItemPedido[]>([]);
  readonly cantidad = computed(() => this.items().reduce((a, i) => a + i.cantidad, 0));
  readonly subtotal = computed(() => this.calculadora.subtotal(this.items()));
  readonly envio = computed(() => this.calculadora.envio(this.items()));
  readonly total = computed(() => this.subtotal() + this.envio());

  agregar(p: Producto): string | null {
    if (!p.disponible) return 'Este producto no está disponible.';
    this.items.update((l) => {
      const ex = l.find((i) => i.productoId === p.id);
      if (ex) return l.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...l, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
    });
    return null;
  }

  cambiarCantidad(productoId: number, cantidad: number) {
    this.items.update((l) => l.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)));
  }

  quitar(productoId: number) {
    this.items.update((l) => l.filter((i) => i.productoId !== productoId));
  }

  vaciar() {
    this.items.set([]);
  }

  /** Director: dirige al Builder paso a paso y devuelve el Pedido listo. */
  armarPedido(id: number, cliente: Usuario, direccion: Direccion): Pedido {
    const builder = new PedidoBuilder().conId(id).paraCliente(cliente).setDireccion(direccion);
    for (const i of this.items()) builder.agregarProducto(i, i.cantidad);
    return builder.setEnvio(this.envio()).build();
  }
}
