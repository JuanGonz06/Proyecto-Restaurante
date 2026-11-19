import { Injectable, computed, inject, signal } from '@angular/core';
import { PedidoContext, TransicionInvalida, estadoDe } from './patrones/estado-pedido';
import { PedidoEstadoObservable } from './patrones/pedido-estado.observable';
import { CarritoService } from './patrones/carrito.service';
import { CalculadoraPedidoService } from './patrones/calculadora-pedido.service';
import { Usuario, fabricaPorRol } from './patrones/usuario.factory';
import type { DatosUsuario } from './patrones/usuario.factory';

export { Usuario };

export type Rol = 'cliente' | 'administrador' | 'domiciliario';
export type Estado = 'Pendiente' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado';
export const FLUJO: Estado[] = ['Pendiente', 'En preparación', 'En camino', 'Entregado'];

export interface Producto { id: number; nombre: string; categoria: string; descripcion: string; precio: number; disponible: boolean; emoji: string; }
export interface Direccion { id: number; clienteEmail: string; etiqueta: string; direccion: string; ciudad: string; referencia: string; principal: boolean; }
export interface ItemPedido { productoId: number; nombre: string; precio: number; cantidad: number; }
export interface Pedido {
  id: number; fecha: string; estado: Estado; items: ItemPedido[]; envio: number; direccion: string;
  clienteEmail: string; clienteNombre: string; clienteTelefono: string; domiciliarioId: number | null;
}
export interface Domiciliario { id: number; nombre: string; telefono: string; email: string; disponible: boolean; }
export type NuevaDireccion = Omit<Direccion, 'id' | 'clienteEmail'>;

export const CATEGORIAS = ['Entradas', 'Platos fuertes', 'Bebidas', 'Postres'];

/**
 * PATRÓN SINGLETON (creación)
 * `providedIn: 'root'` hace que Angular cree UNA sola instancia del Store para toda la app:
 * todas las pantallas leen y modifican el mismo estado (menú, carrito, pedidos).
 * Estado en memoria: simula el back. Al recargar la página vuelve a los datos de ejemplo.
 */
@Injectable({ providedIn: 'root' })
export class Store {
  private sig = 100;
  private eventos = inject(PedidoEstadoObservable);
  private carritoSvc = inject(CarritoService);
  private calculadora = inject(CalculadoraPedidoService);

  usuarios = signal<Usuario[]>([
    this.crearUsuario('cliente', { nombre: 'Ana Gómez', email: 'cliente@correo.com', telefono: '3001234567', password: '123456' }),
    this.crearUsuario('cliente', { nombre: 'Luis Pérez', email: 'otro@correo.com', telefono: '', password: '123456' }),
    this.crearUsuario('administrador', { nombre: 'Administrador', email: 'admin@correo.com', telefono: '3100000000', password: '123456' }),
    this.crearUsuario('domiciliario', { nombre: 'Carlos Ruiz', email: 'domi@correo.com', telefono: '3209876543', password: '123456' }),
  ]);
  usuario = signal<Usuario | null>(null);

  productos = signal<Producto[]>([
    { id: 1, nombre: 'Empanadas (3 uds)', categoria: 'Entradas', descripcion: 'Con ají casero', precio: 9000, disponible: true, emoji: '🥟' },
    { id: 2, nombre: 'Patacones con hogao', categoria: 'Entradas', descripcion: 'Plátano verde crocante', precio: 11000, disponible: true, emoji: '🍌' },
    { id: 3, nombre: 'Bandeja paisa', categoria: 'Platos fuertes', descripcion: 'La clásica, completa', precio: 32000, disponible: true, emoji: '🍛' },
    { id: 4, nombre: 'Salmón a la plancha', categoria: 'Platos fuertes', descripcion: 'Con arroz y ensalada', precio: 38000, disponible: false, emoji: '🐟' },
    { id: 5, nombre: 'Hamburguesa de la casa', categoria: 'Platos fuertes', descripcion: 'Carne 180 g y papas', precio: 26000, disponible: true, emoji: '🍔' },
    { id: 6, nombre: 'Limonada de coco', categoria: 'Bebidas', descripcion: 'Natural, 400 ml', precio: 8000, disponible: true, emoji: '🥥' },
    { id: 7, nombre: 'Jugo de mora', categoria: 'Bebidas', descripcion: 'En agua o en leche', precio: 7000, disponible: true, emoji: '🍹' },
    { id: 8, nombre: 'Brownie con helado', categoria: 'Postres', descripcion: 'Caliente, con salsa de chocolate', precio: 12000, disponible: true, emoji: '🍫' },
  ]);

  /** El carrito vive en CarritoService (Director del Builder); el Store lo expone a las pantallas. */
  carrito = this.carritoSvc.items;

  direcciones = signal<Direccion[]>([
    { id: 1, clienteEmail: 'cliente@correo.com', etiqueta: 'Casa', direccion: 'Cra 45 # 10-20, Apto 301', ciudad: 'Medellín', referencia: 'Portería azul', principal: true },
    { id: 2, clienteEmail: 'cliente@correo.com', etiqueta: 'Oficina', direccion: 'Calle 50 # 30-15, Piso 4', ciudad: 'Medellín', referencia: '', principal: false },
  ]);

  domiciliarios = signal<Domiciliario[]>([
    { id: 1, nombre: 'Carlos Ruiz', telefono: '3209876543', email: 'domi@correo.com', disponible: true },
    { id: 2, nombre: 'María Torres', telefono: '3151112233', email: 'maria@correo.com', disponible: true },
    { id: 3, nombre: 'Jorge Díaz', telefono: '3004445566', email: 'jorge@correo.com', disponible: false },
  ]);

  pedidos = signal<Pedido[]>([
    {
      id: 1001, fecha: '2026-10-01T12:30:00', estado: 'Entregado', direccion: 'Cra 45 # 10-20, Apto 301, Medellín',
      clienteEmail: 'cliente@correo.com', clienteNombre: 'Ana Gómez', clienteTelefono: '3001234567', domiciliarioId: 1, envio: 5000,
      items: [{ productoId: 3, nombre: 'Bandeja paisa', precio: 30000, cantidad: 1 }, { productoId: 6, nombre: 'Limonada de coco', precio: 8000, cantidad: 2 }],
    },
    {
      id: 1002, fecha: '2026-10-12T19:10:00', estado: 'En camino', direccion: 'Calle 50 # 30-15, Piso 4, Medellín',
      clienteEmail: 'cliente@correo.com', clienteNombre: 'Ana Gómez', clienteTelefono: '3001234567', domiciliarioId: 1, envio: 5000,
      items: [{ productoId: 5, nombre: 'Hamburguesa de la casa', precio: 26000, cantidad: 2 }],
    },
    {
      id: 1003, fecha: '2026-10-13T13:05:00', estado: 'Pendiente', direccion: 'Cra 70 # 2-10, Medellín',
      clienteEmail: 'otro@correo.com', clienteNombre: 'Luis Pérez', clienteTelefono: '', domiciliarioId: null, envio: 5000,
      items: [{ productoId: 1, nombre: 'Empanadas (3 uds)', precio: 9000, cantidad: 2 }, { productoId: 7, nombre: 'Jugo de mora', precio: 7000, cantidad: 1 }],
    },
  ]);

  // ---------- derivados ----------
  cantidadCarrito = this.carritoSvc.cantidad;
  subtotalCarrito = this.carritoSvc.subtotal;
  envioCarrito = this.carritoSvc.envio;
  totalCarrito = this.carritoSvc.total;
  pedidosCliente = computed(() => this.pedidos().filter((p) => p.clienteEmail === this.usuario()?.email));
  direccionesCliente = computed(() => this.direcciones().filter((d) => d.clienteEmail === this.usuario()?.email));
  domiciliarioActual = computed(() => this.domiciliarios().find((d) => d.email === this.usuario()?.email) ?? null);

  /** Total de un pedido ya creado: productos + el envío que se calculó al crearlo. */
  totalPedido(p: Pedido): number { return this.calculadora.subtotal(p.items) + p.envio; }
  subtotalPedido(p: Pedido): number { return this.calculadora.subtotal(p.items); }

  estadoClase(e: Estado): string { return estadoDe(e).clase; }

  // ---------- sesión (HU-2.1, 2.2, 2.3, 2.5) ----------
  login(email: string, password: string): string | null {
    const u = this.usuarios().find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if (!u) return 'Correo o contraseña incorrectos.';
    this.usuario.set(u);
    return null;
  }
  logout() { this.usuario.set(null); this.carritoSvc.vaciar(); }

  registrar(nombre: string, email: string, telefono: string, password: string): string | null {
    if (this.usuarios().some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return 'Ese correo ya está registrado.';
    const u = this.crearUsuario('cliente', { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim(), password }); // Factory Method
    this.usuarios.update((l) => [...l, u]);
    this.usuario.set(u);
    return null;
  }

  actualizarPerfil(nombre: string, telefono: string) {
    const u = this.usuario();
    if (!u) return;
    const nuevo = this.crearUsuario(u.rol, { nombre: nombre.trim(), email: u.email, telefono: telefono.trim(), password: u.password });
    this.usuarios.update((l) => l.map((x) => (x.email === u.email ? nuevo : x)));
    this.usuario.set(nuevo);
  }

  correoRegistrado(email: string): boolean {
    return this.usuarios().some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }
  cambiarPassword(email: string, password: string) {
    this.usuarios.update((l) => l.map((x) =>
      x.email.toLowerCase() === email.trim().toLowerCase()
        ? this.crearUsuario(x.rol, { nombre: x.nombre, email: x.email, telefono: x.telefono, password })
        : x));
  }

  // ---------- carrito (HU-1.1, 1.2, 1.5) ----------
  agregarAlCarrito(p: Producto): string | null { return this.carritoSvc.agregar(p); }
  cambiarCantidad(productoId: number, cantidad: number) { this.carritoSvc.cambiarCantidad(productoId, cantidad); }
  quitarDelCarrito(productoId: number) { this.carritoSvc.quitar(productoId); }

  // ---------- direcciones (HU-3.1) ----------
  agregarDireccion(d: NuevaDireccion) {
    const email = this.usuario()?.email ?? '';
    const primera = this.direccionesCliente().length === 0;
    const principal = d.principal || primera;
    const nueva: Direccion = { ...d, principal, id: ++this.sig, clienteEmail: email };
    this.direcciones.update((l) => [...l.map((x) => (principal && x.clienteEmail === email ? { ...x, principal: false } : x)), nueva]);
  }
  marcarPrincipal(id: number) {
    const email = this.usuario()?.email;
    this.direcciones.update((l) => l.map((x) => (x.clienteEmail === email ? { ...x, principal: x.id === id } : x)));
  }

  // ---------- pedidos (HU-1.3, 1.5, 3.2, 3.4) ----------
  confirmarPedido(direccionId: number | null): { error?: string; id?: number } {
    const u = this.usuario();
    const items = this.carrito();
    if (!u) return { error: 'Inicia sesión para confirmar el pedido.' };
    if (items.length === 0) return { error: 'Tu pedido está vacío. Agrega al menos un producto.' };
    for (const i of items) {
      const p = this.productos().find((x) => x.id === i.productoId);
      if (!p || !p.disponible) return { error: `"${i.nombre}" ya no está disponible. Quítalo del pedido para continuar.` };
    }
    const dir = this.direccionesCliente().find((d) => d.id === direccionId);
    if (!dir) return { error: 'Selecciona o registra una dirección de entrega.' };
    try {
      const pedido = this.carritoSvc.armarPedido(++this.sig + 1000, u, dir); // Builder (Director: CarritoService)
      this.pedidos.update((l) => [...l, pedido]);
      this.carritoSvc.vaciar();
      this.avisar('creado', pedido, `Nuevo pedido #${pedido.id} de ${pedido.clienteNombre}.`);
      return { id: pedido.id };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  cancelarPedido(id: number): string | null {
    const p = this.pedidos().find((x) => x.id === id);
    if (!p) return 'Pedido no encontrado.';
    const ctx = new PedidoContext(p.estado); // State
    try {
      ctx.cancelar();
    } catch (e) {
      if (e instanceof TransicionInvalida) return 'Este pedido ya no se puede cancelar porque dejó de estar pendiente.';
      throw e;
    }
    const nuevo: Pedido = { ...p, estado: ctx.estado };
    this.pedidos.update((l) => l.map((x) => (x.id === id ? nuevo : x)));
    this.avisar('cancelado', nuevo, `El pedido #${p.id} fue cancelado.`);
    return null;
  }

  asignarDomiciliario(pedidoId: number, domId: number): string | null {
    const p = this.pedidos().find((x) => x.id === pedidoId);
    if (!p || !estadoDe(p.estado).puedeAsignarDomiciliario()) return 'Solo se pueden asignar pedidos pendientes (no cancelados).';
    const d = this.domiciliarios().find((x) => x.id === domId);
    if (!d || !d.disponible) return 'El domiciliario no está disponible.';
    const ctx = new PedidoContext(p.estado); // State: Pendiente → En preparación
    ctx.avanzar();
    const nuevo: Pedido = { ...p, estado: ctx.estado, domiciliarioId: domId };
    this.pedidos.update((l) => l.map((x) => (x.id === pedidoId ? nuevo : x)));
    this.avisar('asignado', nuevo, `Tu pedido #${p.id} está en preparación con ${d.nombre}.`);
    return null;
  }

  avanzarEntrega(pedidoId: number) {
    const p = this.pedidos().find((x) => x.id === pedidoId);
    if (!p || !estadoDe(p.estado).accionDomiciliario()) return; // State: solo si el domiciliario puede actuar
    const ctx = new PedidoContext(p.estado);
    ctx.avanzar();
    const nuevo: Pedido = { ...p, estado: ctx.estado };
    this.pedidos.update((l) => l.map((x) => (x.id === pedidoId ? nuevo : x)));
    this.avisar('estado', nuevo, `Tu pedido #${p.id} ahora está: ${nuevo.estado}.`);
  }

  /** Solo para la demostración: hace el siguiente paso como si lo hicieran el administrador o el domiciliario. */
  simularAvance(pedidoId: number) {
    const p = this.pedidos().find((x) => x.id === pedidoId);
    if (!p) return;
    if (estadoDe(p.estado).puedeAsignarDomiciliario()) {
      const d = this.domiciliarios().find((x) => x.disponible);
      if (d) this.asignarDomiciliario(pedidoId, d.id);
    } else {
      this.avanzarEntrega(pedidoId);
    }
  }

  /** Observer: publica el evento; el Store no sabe quién lo escucha. */
  private avisar(tipo: 'creado' | 'cancelado' | 'asignado' | 'estado', p: Pedido, mensaje: string) {
    this.eventos.publicar({ tipo, pedidoId: p.id, clienteEmail: p.clienteEmail, domiciliarioId: p.domiciliarioId, estado: p.estado, mensaje });
  }

  // ---------- menú del administrador (HU-4.2 a 4.5) ----------
  guardarProducto(p: Omit<Producto, 'id'> & { id?: number }) {
    if (p.id) {
      this.productos.update((l) => l.map((x) => (x.id === p.id ? { ...x, ...p, id: x.id } : x)));
    } else {
      this.productos.update((l) => [...l, { ...p, id: ++this.sig }]);
    }
  }
  alternarDisponibilidad(id: number) {
    this.productos.update((l) => l.map((x) => (x.id === id ? { ...x, disponible: !x.disponible } : x)));
  }
  eliminarProducto(id: number) {
    this.productos.update((l) => l.filter((x) => x.id !== id));
    this.carritoSvc.quitar(id);
  }

  /** Factory Method: el Store nunca usa `new Cliente(...)`; le pide el objeto a la fábrica del rol. */
  private crearUsuario(rol: Rol, datos: DatosUsuario): Usuario {
    return fabricaPorRol(rol).crearUsuario(datos);
  }
}
