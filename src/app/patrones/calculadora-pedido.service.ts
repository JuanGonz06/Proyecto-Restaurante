import { Injectable, signal } from '@angular/core';
import type { ItemPedido } from '../store.service';
import { ESTRATEGIAS_ENVIO } from './envio.strategy';
import type { CalculoEnvioStrategy } from './envio.strategy';

/**
 * Context del patrón Strategy: calcula subtotal, envío y total delegando el envío
 * en la estrategia vigente. El administrador puede cambiar la estrategia en tiempo de ejecución.
 */
@Injectable({ providedIn: 'root' })
export class CalculadoraPedidoService {
  readonly estrategias = ESTRATEGIAS_ENVIO;
  readonly estrategia = signal<CalculoEnvioStrategy>(ESTRATEGIAS_ENVIO[0]); // MVP: tarifa fija

  cambiarEstrategia(id: string) {
    const e = this.estrategias.find((x) => x.id === id);
    if (e) this.estrategia.set(e);
  }

  subtotal(items: ItemPedido[]): number {
    return items.reduce((a, i) => a + i.precio * i.cantidad, 0);
  }

  envio(items: ItemPedido[]): number {
    const s = this.subtotal(items);
    return s === 0 ? 0 : this.estrategia().calcularCosto(s);
  }

  total(items: ItemPedido[]): number {
    return this.subtotal(items) + this.envio(items);
  }
}
