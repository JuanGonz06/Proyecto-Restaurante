import { DestroyRef, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { Estado } from '../store.service';

export interface EventoPedido {
  tipo: 'creado' | 'cancelado' | 'asignado' | 'estado';
  pedidoId: number;
  clienteEmail: string;
  domiciliarioId: number | null;
  estado: Estado;
  mensaje: string;
}

/** Observer (interfaz): quien quiera enterarse de los cambios de un pedido la implementa. */
export interface PedidoObserver {
  onPedidoCambio(evento: EventoPedido): void;
}

/**
 * PATRÓN OBSERVER (comportamiento)
 * El Store (quien modifica el pedido) publica un evento; las pantallas interesadas se suscriben
 * y se enteran sin que el Store sepa cuáles son. Representa la actualización en tiempo real (RNF-05)
 * del seguimiento del cliente y del panel del administrador.
 *
 *   Subject           → PedidoEstadoObservable (RxJS Subject)
 *   Observer          → PedidoObserver
 *   ConcreteObservers → SeguimientoComponent (cliente), AdminPedidosComponent (panel admin),
 *                       DomPedidosComponent (entregas nuevas del domiciliario)
 */
@Injectable({ providedIn: 'root' })
export class PedidoEstadoObservable {
  private readonly sujeto = new Subject<EventoPedido>();
  readonly estadoPedido$ = this.sujeto.asObservable();

  publicar(evento: EventoPedido) {
    this.sujeto.next(evento);
  }

  /** Suscribe un observer y lo desuscribe solo cuando su componente se destruye. */
  suscribir(observer: PedidoObserver, destroyRef: DestroyRef) {
    const sub = this.estadoPedido$.subscribe((e) => observer.onPedidoCambio(e));
    destroyRef.onDestroy(() => sub.unsubscribe());
  }
}
