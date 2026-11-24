from pydantic import Field

from app.schemas.common import CamelModel, Limpio


class DireccionIn(CamelModel):
    etiqueta: Limpio = Field(min_length=1, max_length=40)
    direccion: Limpio = Field(min_length=5, max_length=200)
    ciudad: Limpio = Field(min_length=2, max_length=80)
    referencia: Limpio = Field(default="", max_length=200)
    principal: bool = False


class DireccionOut(CamelModel):
    id: int
    etiqueta: str
    direccion: str
    ciudad: str
    referencia: str
    principal: bool
