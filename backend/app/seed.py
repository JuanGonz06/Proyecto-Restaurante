"""Datos de ejemplo (los mismos que usa el frontend). Solo se cargan si la base de datos está vacía.

Todas las cuentas de ejemplo tienen la contraseña 123456: úsalas únicamente en desarrollo.
Para no cargarlos, define CARGAR_DATOS_EJEMPLO=false.
"""
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Direccion, Domiciliario, Pedido, PedidoItem, Producto, Usuario


def cargar_datos_ejemplo(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Usuario)):
        return

    clave = hash_password("123456")
    ana = Usuario(nombre="Ana Gómez", email="cliente@correo.com", telefono="3001234567", password_hash=clave, rol="cliente")
    luis = Usuario(nombre="Luis Pérez", email="otro@correo.com", telefono="", password_hash=clave, rol="cliente")
    admin = Usuario(nombre="Administrador", email="admin@correo.com", telefono="3100000000", password_hash=clave, rol="administrador")
    carlos_u = Usuario(nombre="Carlos Ruiz", email="domi@correo.com", telefono="3209876543", password_hash=clave, rol="domiciliario")
    db.add_all([ana, luis, admin, carlos_u])
    db.flush()

    db.add_all(
        [
            Producto(nombre="Empanadas (3 uds)", categoria="Entradas", descripcion="Con ají casero", precio=9000, disponible=True, emoji="🥟"),
            Producto(nombre="Patacones con hogao", categoria="Entradas", descripcion="Plátano verde crocante", precio=11000, disponible=True, emoji="🍌"),
            Producto(nombre="Bandeja paisa", categoria="Platos fuertes", descripcion="La clásica, completa", precio=32000, disponible=True, emoji="🍛"),
            Producto(nombre="Salmón a la plancha", categoria="Platos fuertes", descripcion="Con arroz y ensalada", precio=38000, disponible=False, emoji="🐟"),
            Producto(nombre="Hamburguesa de la casa", categoria="Platos fuertes", descripcion="Carne 180 g y papas", precio=26000, disponible=True, emoji="🍔"),
            Producto(nombre="Limonada de coco", categoria="Bebidas", descripcion="Natural, 400 ml", precio=8000, disponible=True, emoji="🥥"),
            Producto(nombre="Jugo de mora", categoria="Bebidas", descripcion="En agua o en leche", precio=7000, disponible=True, emoji="🍹"),
            Producto(nombre="Brownie con helado", categoria="Postres", descripcion="Caliente, con salsa de chocolate", precio=12000, disponible=True, emoji="🍫"),
        ]
    )
    db.add_all(
        [
            Direccion(cliente_id=ana.id, etiqueta="Casa", direccion="Cra 45 # 10-20, Apto 301", ciudad="Medellín", referencia="Portería azul", principal=True),
            Direccion(cliente_id=ana.id, etiqueta="Oficina", direccion="Calle 50 # 30-15, Piso 4", ciudad="Medellín", referencia="", principal=False),
        ]
    )
    carlos = Domiciliario(nombre="Carlos Ruiz", telefono="3209876543", email="domi@correo.com", disponible=True, usuario_id=carlos_u.id)
    db.add_all(
        [
            carlos,
            Domiciliario(nombre="María Torres", telefono="3151112233", email="maria@correo.com", disponible=True),
            Domiciliario(nombre="Jorge Díaz", telefono="3004445566", email="jorge@correo.com", disponible=False),
        ]
    )
    db.flush()

    def fecha(*args: int) -> datetime:
        return datetime(*args, tzinfo=timezone.utc)

    db.add_all(
        [
            Pedido(
                fecha=fecha(2026, 10, 1, 12, 30), estado="Entregado", envio=5000, direccion="Cra 45 # 10-20, Apto 301, Medellín",
                cliente_id=ana.id, cliente_nombre=ana.nombre, cliente_telefono=ana.telefono, domiciliario_id=carlos.id,
                items=[
                    PedidoItem(producto_id=3, nombre="Bandeja paisa", precio=30000, cantidad=1),
                    PedidoItem(producto_id=6, nombre="Limonada de coco", precio=8000, cantidad=2),
                ],
            ),
            Pedido(
                fecha=fecha(2026, 10, 12, 19, 10), estado="En camino", envio=5000, direccion="Calle 50 # 30-15, Piso 4, Medellín",
                cliente_id=ana.id, cliente_nombre=ana.nombre, cliente_telefono=ana.telefono, domiciliario_id=carlos.id,
                items=[PedidoItem(producto_id=5, nombre="Hamburguesa de la casa", precio=26000, cantidad=2)],
            ),
            Pedido(
                fecha=fecha(2026, 10, 13, 13, 5), estado="Pendiente", envio=5000, direccion="Cra 70 # 2-10, Medellín",
                cliente_id=luis.id, cliente_nombre=luis.nombre, cliente_telefono=luis.telefono, domiciliario_id=None,
                items=[
                    PedidoItem(producto_id=1, nombre="Empanadas (3 uds)", precio=9000, cantidad=2),
                    PedidoItem(producto_id=7, nombre="Jugo de mora", precio=7000, cantidad=1),
                ],
            ),
        ]
    )
    db.commit()
