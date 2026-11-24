from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Configuracion(Base):
    """Ajustes del sistema en formato clave/valor (por ejemplo, la estrategia de envío vigente)."""

    __tablename__ = "configuracion"

    clave: Mapped[str] = mapped_column(String(50), primary_key=True)
    valor: Mapped[str] = mapped_column(String(100))
