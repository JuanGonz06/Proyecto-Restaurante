from pydantic import Field, field_validator

from app.schemas.common import CamelModel, Limpio

CATEGORIAS = ["Entradas", "Platos fuertes", "Bebidas", "Postres"]


class ProductoIn(CamelModel):
    nombre: Limpio = Field(min_length=2, max_length=120)
    categoria: Limpio
    descripcion: Limpio = Field(default="", max_length=300)
    precio: int = Field(gt=0, le=10_000_000)
    disponible: bool = True
    emoji: Limpio = Field(default="🍽️", max_length=10)

    @field_validator("categoria")
    @classmethod
    def _categoria_valida(cls, valor: str) -> str:
        if valor not in CATEGORIAS:
            raise ValueError(f"La categoría debe ser una de: {', '.join(CATEGORIAS)}.")
        return valor


class ProductoOut(CamelModel):
    id: int
    nombre: str
    categoria: str
    descripcion: str
    precio: int
    disponible: bool
    emoji: str


class DisponibilidadIn(CamelModel):
    disponible: bool
