from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    categoria: Mapped[str] = mapped_column(String(40), index=True)
    descripcion: Mapped[str] = mapped_column(String(300), default="")
    precio: Mapped[int] = mapped_column(Integer)  # pesos colombianos, sin decimales
    disponible: Mapped[bool] = mapped_column(Boolean, default=True)
    emoji: Mapped[str] = mapped_column(String(16), default="🍽️")
