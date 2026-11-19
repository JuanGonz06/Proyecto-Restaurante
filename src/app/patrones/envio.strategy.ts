/**
 * PATRÓN STRATEGY (comportamiento)
 * El costo de envío se calcula con una estrategia intercambiable: tarifa fija (la del MVP)
 * o envío gratis desde un monto mínimo. La entidad Pedido no conoce la fórmula; solo guarda
 * el costo que se calculó al crearlo. Cambiar de política en tiempo de ejecución no toca el Pedido.
 *
 *   Context            → CalculadoraPedidoService
 *   Strategy           → CalculoEnvioStrategy
 *   ConcreteStrategies → EnvioTarifaFijaStrategy, EnvioGratisStrategy
 */
export interface CalculoEnvioStrategy {
  readonly id: string;
  readonly etiqueta: string;
  calcularCosto(subtotal: number): number;
}

export const TARIFA_BASE = 5000;

export class EnvioTarifaFijaStrategy implements CalculoEnvioStrategy {
  readonly id = 'fija';
  readonly etiqueta = 'Tarifa fija de $5.000';
  calcularCosto(_subtotal: number): number {
    return TARIFA_BASE; // Tarifa base fija del MVP
  }
}

export class EnvioGratisStrategy implements CalculoEnvioStrategy {
  readonly id = 'gratis';
  readonly etiqueta = 'Envío gratis desde $60.000';
  constructor(private readonly minimo = 60000) {}
  calcularCosto(subtotal: number): number {
    return subtotal >= this.minimo ? 0 : TARIFA_BASE;
  }
}

export const ESTRATEGIAS_ENVIO: CalculoEnvioStrategy[] = [new EnvioTarifaFijaStrategy(), new EnvioGratisStrategy()];
