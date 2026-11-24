from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.utils import ahora_utc
from app.models.usuario import Usuario


class Pedido(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=ahora_utc, index=True)
    estado: Mapped[str] = mapped_column(String(20), default="Pendiente", index=True)
    envio: Mapped[int] = mapped_column(Integer, default=0)
    direccion: Mapped[str] = mapped_column(String(300))  # copia del texto: el pedido no cambia si el cliente edita su dirección
    cliente_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    cliente_nombre: Mapped[str] = mapped_column(String(100))
    cliente_telefono: Mapped[str] = mapped_column(String(30), default="")
    domiciliario_id: Mapped[int | None] = mapped_column(ForeignKey("domiciliarios.id", ondelete="SET NULL"), nullable=True, index=True)

    cliente: Mapped[Usuario] = relationship(lazy="joined")
    items: Mapped[list["PedidoItem"]] = relationship(
        back_populates="pedido", cascade="all, delete-orphan", order_by="PedidoItem.id", lazy="selectin"
    )

    @property
    def cliente_email(self) -> str:
        return self.cliente.email

    @property
    def subtotal(self) -> int:
        return sum(i.precio * i.cantidad for i in self.items)

    @property
    def total(self) -> int:
        return self.subtotal + self.envio


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id", ondelete="CASCADE"), index=True)
    # Si el administrador borra el producto, el pedido conserva nombre y precio del momento (precio histórico).
    producto_id: Mapped[int | None] = mapped_column(ForeignKey("productos.id", ondelete="SET NULL"), nullable=True)
    nombre: Mapped[str] = mapped_column(String(120))
    precio: Mapped[int] = mapped_column(Integer)
    cantidad: Mapped[int] = mapped_column(Integer)

    pedido: Mapped[Pedido] = relationship(back_populates="items")
