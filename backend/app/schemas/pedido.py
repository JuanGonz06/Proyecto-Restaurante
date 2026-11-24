from datetime import datetime, timezone

from pydantic import Field, field_validator

from app.schemas.common import CamelModel


class ItemIn(CamelModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(ge=1, le=99)


class PedidoIn(CamelModel):
    direccion_id: int = Field(gt=0)
    items: list[ItemIn] = Field(min_length=1, max_length=50)


class ItemOut(CamelModel):
    producto_id: int | None
    nombre: str
    precio: int
    cantidad: int


class PedidoOut(CamelModel):
    id: int
    fecha: datetime
    estado: str
    items: list[ItemOut]
    envio: int
    direccion: str
    cliente_email: str
    cliente_nombre: str
    cliente_telefono: str
    domiciliario_id: int | None
    subtotal: int
    total: int

    @field_validator("fecha")
    @classmethod
    def _fecha_utc(cls, valor: datetime) -> datetime:
        # SQLite devuelve fechas sin zona; se marcan como UTC para que el front las muestre bien.
        return valor.replace(tzinfo=timezone.utc) if valor.tzinfo is None else valor


class AsignarIn(CamelModel):
    domiciliario_id: int = Field(gt=0)
