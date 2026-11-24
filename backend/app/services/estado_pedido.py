"""PATRÓN STATE: cada estado del pedido decide qué transiciones permite.

    Pendiente ──asignar domiciliario──▶ En preparación ──▶ En camino ──▶ Entregado
        └──cancelar (RN-01: solo si está pendiente)──▶ Cancelado

Una transición inválida lanza TransicionInvalida; la API la convierte en un 409.
"""

PENDIENTE = "Pendiente"
EN_PREPARACION = "En preparación"
EN_CAMINO = "En camino"
ENTREGADO = "Entregado"
CANCELADO = "Cancelado"

ESTADOS = (PENDIENTE, EN_PREPARACION, EN_CAMINO, ENTREGADO, CANCELADO)


class TransicionInvalida(Exception):
    pass


class _Estado:
    nombre = ""
    puede_cancelar = False
    puede_asignar_domiciliario = False
    puede_marcar_entrega = False  # el domiciliario puede avanzar el pedido desde este estado

    def cancelar(self) -> "_Estado":
        raise TransicionInvalida(f'Un pedido en estado "{self.nombre}" no se puede cancelar.')

    def avanzar(self) -> "_Estado":
        raise TransicionInvalida(f'Un pedido en estado "{self.nombre}" no puede avanzar.')


class _Pendiente(_Estado):
    nombre = PENDIENTE
    puede_cancelar = True
    puede_asignar_domiciliario = True

    def cancelar(self) -> _Estado:
        return _ESTADOS[CANCELADO]

    def avanzar(self) -> _Estado:  # ocurre al asignar un domiciliario
        return _ESTADOS[EN_PREPARACION]


class _EnPreparacion(_Estado):
    nombre = EN_PREPARACION
    puede_marcar_entrega = True

    def avanzar(self) -> _Estado:
        return _ESTADOS[EN_CAMINO]


class _EnCamino(_Estado):
    nombre = EN_CAMINO
    puede_marcar_entrega = True

    def avanzar(self) -> _Estado:
        return _ESTADOS[ENTREGADO]


class _Entregado(_Estado):
    nombre = ENTREGADO


class _Cancelado(_Estado):
    nombre = CANCELADO


_ESTADOS = {e.nombre: e for e in (_Pendiente(), _EnPreparacion(), _EnCamino(), _Entregado(), _Cancelado())}


def estado_de(nombre: str) -> _Estado:
    try:
        return _ESTADOS[nombre]
    except KeyError:
        raise ValueError(f"Estado desconocido: {nombre!r}") from None


class PedidoContext:
    """Context del patrón: guarda el estado actual y le delega el comportamiento."""

    def __init__(self, estado: str) -> None:
        self._estado = estado_de(estado)

    @property
    def estado(self) -> str:
        return self._estado.nombre

    def cancelar(self) -> None:
        self._estado = self._estado.cancelar()

    def avanzar(self) -> None:
        self._estado = self._estado.avanzar()
