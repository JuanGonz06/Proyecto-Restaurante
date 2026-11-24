"""PATRÓN STRATEGY: el costo de envío se calcula con una estrategia intercambiable.

El administrador puede cambiar la estrategia vigente (PUT /api/envio/estrategia) sin tocar el Pedido,
que solo guarda el costo calculado al crearlo.
"""

TARIFA_BASE = 5000
ESTRATEGIA_POR_DEFECTO = "fija"


class EnvioTarifaFija:
    id = "fija"
    etiqueta = "Tarifa fija de $5.000"

    def calcular_costo(self, subtotal: int) -> int:
        return TARIFA_BASE


class EnvioGratis:
    id = "gratis"
    etiqueta = "Envío gratis desde $60.000"
    minimo = 60000

    def calcular_costo(self, subtotal: int) -> int:
        return 0 if subtotal >= self.minimo else TARIFA_BASE


ESTRATEGIAS = {e.id: e for e in (EnvioTarifaFija(), EnvioGratis())}


def obtener_estrategia(estrategia_id: str):
    """Devuelve la estrategia pedida, o la tarifa fija si el id no existe."""
    return ESTRATEGIAS.get(estrategia_id, ESTRATEGIAS[ESTRATEGIA_POR_DEFECTO])


def calcular_envio(estrategia, subtotal: int) -> int:
    return 0 if subtotal <= 0 else estrategia.calcular_costo(subtotal)
