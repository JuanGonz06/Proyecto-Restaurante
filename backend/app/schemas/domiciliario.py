from pydantic import Field

from app.schemas.common import CamelModel, Correo, Limpio


class DomiciliarioIn(CamelModel):
    nombre: Limpio = Field(min_length=2, max_length=100)
    telefono: Limpio = Field(default="", max_length=30)
    email: Correo
    password: str = Field(min_length=6, max_length=128)


class DomiciliarioOut(CamelModel):
    id: int
    nombre: str
    telefono: str
    email: str
    disponible: bool
