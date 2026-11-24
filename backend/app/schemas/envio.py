from pydantic import Field

from app.schemas.common import CamelModel


class EstrategiaOut(CamelModel):
    id: str
    etiqueta: str
    activa: bool


class EstrategiaIn(CamelModel):
    id: str = Field(min_length=1, max_length=30)


class CotizacionOut(CamelModel):
    subtotal: int
    envio: int
    total: int
