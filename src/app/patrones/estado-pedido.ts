import type { Estado } from '../store.service';

/**
 * PATRÓN STATE (comportamiento)
 * Cada estado del pedido es una clase que decide qué transiciones permite. Así la regla RN-01
 * (solo se cancela un pedido pendiente) y el avance de la entrega viven en un solo lugar,
 * y una transición inválida lanza un error en vez de ejecutarse.
 *
 *   Context        → PedidoContext (envuelve el estado actual de un Pedido)
 *   State          → EstadoPedidoState
 *   ConcreteStates → PendienteState, EnPreparacionState, EnCaminoState, EntregadoState, CanceladoState
 */
export class TransicionInvalida extends Error {}

export interface EstadoPedidoState {
  readonly nombre: Estado;
  /** Clase CSS del badge. */
  readonly clase: string;
  cancelar(pedido: PedidoContext): void;
  avanzar(pedido: PedidoContext): void;
  puedeCancelar(): boolean;
  puedeAsignarDomiciliario(): boolean;
  /** Acción del domiciliario en este estado; null si no tiene ninguna. */
  accionDomiciliario(): { siguiente: Estado; texto: string } | null;
}

/** Context: guarda el estado actual y le delega el comportamiento. */
export class PedidoContext {
  private estadoActual: EstadoPedidoState;

  constructor(estado: Estado) {
    this.estadoActual = estadoDe(estado);
  }

  get estado(): Estado { return this.estadoActual.nombre; }
  setEstado(nuevo: EstadoPedidoState) { this.estadoActual = nuevo; }
  cancelar() { this.estadoActual.cancelar(this); }
  avanzar() { this.estadoActual.avanzar(this); }
}

abstract class EstadoBase implements EstadoPedidoState {
  abstract readonly nombre: Estado;
  abstract readonly clase: string;
  cancelar(_pedido: PedidoContext): void {
    throw new TransicionInvalida(`Un pedido en estado "${this.nombre}" no se puede cancelar.`);
  }
  avanzar(_pedido: PedidoContext): void {
    throw new TransicionInvalida(`Un pedido en estado "${this.nombre}" no puede avanzar.`);
  }
  puedeCancelar() { return false; }
  puedeAsignarDomiciliario() { return false; }
  accionDomiciliario(): { siguiente: Estado; texto: string } | null { return null; }
}

export class PendienteState extends EstadoBase {
  readonly nombre: Estado = 'Pendiente';
  readonly clase = 'warn';
  override cancelar(pedido: PedidoContext) { pedido.setEstado(new CanceladoState()); }
  override avanzar(pedido: PedidoContext) { pedido.setEstado(new EnPreparacionState()); } // al asignar domiciliario
  override puedeCancelar() { return true; }
  override puedeAsignarDomiciliario() { return true; }
}
export class EnPreparacionState extends EstadoBase {
  readonly nombre: Estado = 'En preparación';
  readonly clase = 'info';
  override avanzar(pedido: PedidoContext) { pedido.setEstado(new EnCaminoState()); }
  override accionDomiciliario() { return { siguiente: 'En camino' as Estado, texto: 'Marcar en camino' }; }
}
export class EnCaminoState extends EstadoBase {
  readonly nombre: Estado = 'En camino';
  readonly clase = 'info';
  override avanzar(pedido: PedidoContext) { pedido.setEstado(new EntregadoState()); }
  override accionDomiciliario() { return { siguiente: 'Entregado' as Estado, texto: 'Marcar entregado' }; }
}
export class EntregadoState extends EstadoBase {
  readonly nombre: Estado = 'Entregado';
  readonly clase = 'ok';
}
export class CanceladoState extends EstadoBase {
  readonly nombre: Estado = 'Cancelado';
  readonly clase = 'bad';
}

const ESTADOS: Record<Estado, EstadoPedidoState> = {
  'Pendiente': new PendienteState(),
  'En preparación': new EnPreparacionState(),
  'En camino': new EnCaminoState(),
  'Entregado': new EntregadoState(),
  'Cancelado': new CanceladoState(),
};

export function estadoDe(e: Estado): EstadoPedidoState {
  return ESTADOS[e];
}
