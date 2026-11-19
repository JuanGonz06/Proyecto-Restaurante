import type { Direccion, ItemPedido, Pedido } from '../store.service';
import type { Usuario } from './usuario.factory';

/**
 * PATRÓN BUILDER (creación)
 * Un Pedido se arma por etapas: cliente, productos con su cantidad, dirección y costo de envío.
 * El Builder acumula cada paso y `build()` valida que el pedido esté completo antes de entregarlo.
 * El Director es `CarritoService` (ver carrito.service.ts).
 *
 *   Builder  → PedidoBuilder
 *   Product  → Pedido
 *   Director → CarritoService
 */
export class PedidoBuilder {
  private id = 0;
  private cliente: Usuario | null = null;
  private direccion: Direccion | null = null;
  private items: ItemPedido[] = [];
  private costoEnvio = 0;

  conId(id: number): this {
    this.id = id;
    return this;
  }

  paraCliente(cliente: Usuario): this {
    this.cliente = cliente;
    return this;
  }

  /** Agrega un producto con el precio del momento (precio histórico, HU-4.3). */
  agregarProducto(producto: { productoId: number; nombre: string; precio: number }, cantidad: number): this {
    if (!Number.isInteger(cantidad) || cantidad < 1) throw new Error('La cantidad debe ser un entero mayor o igual a 1.');
    const existente = this.items.find((i) => i.productoId === producto.productoId);
    if (existente) existente.cantidad += cantidad;
    else this.items.push({ productoId: producto.productoId, nombre: producto.nombre, precio: producto.precio, cantidad });
    return this;
  }

  setDireccion(direccion: Direccion): this {
    this.direccion = direccion;
    return this;
  }

  setEnvio(costo: number): this {
    this.costoEnvio = costo;
    return this;
  }

  build(): Pedido {
    if (!this.cliente) throw new Error('El pedido necesita un cliente.');
    if (this.items.length === 0) throw new Error('Tu pedido está vacío. Agrega al menos un producto.');
    if (!this.direccion) throw new Error('Selecciona o registra una dirección de entrega.');
    return {
      id: this.id,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      items: this.items.map((i) => ({ ...i })),
      envio: this.costoEnvio,
      direccion: `${this.direccion.direccion}, ${this.direccion.ciudad}`,
      clienteEmail: this.cliente.email,
      clienteNombre: this.cliente.nombre,
      clienteTelefono: this.cliente.telefono,
      domiciliarioId: null,
    };
  }
}
