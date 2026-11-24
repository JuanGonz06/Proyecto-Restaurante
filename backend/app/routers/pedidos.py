"""Pedidos: creación, consulta, cancelación, asignación y avance de entrega (HU-1.3, 1.5, 3.2, 3.4).

Quién puede hacer qué:
  cliente        → crear, ver los suyos, cancelar uno suyo si está Pendiente
  administrador  → ver todos, asignar domiciliario a un pedido Pendiente
  domiciliario   → ver los asignados a él, avanzar la entrega (En preparación → En camino → Entregado)
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import domiciliario_de, get_current_user, require_roles
from app.models import Direccion, Domiciliario, Pedido, PedidoItem, Producto, Usuario
from app.schemas.pedido import AsignarIn, PedidoIn, PedidoOut
from app.services.configuracion import estrategia_envio_actual
from app.services.envio import calcular_envio
from app.services.estado_pedido import ESTADOS, PENDIENTE, PedidoContext, TransicionInvalida, estado_de

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _salida(pedido: Pedido) -> PedidoOut:
    # Se convierte dentro del endpoint, con la sesión de base de datos todavía abierta.
    return PedidoOut.model_validate(pedido)


def _pedido_o_404(db: Session, pedido_id: int) -> Pedido:
    pedido = db.get(Pedido, pedido_id)
    if pedido is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado.")
    return pedido


@router.post("", response_model=PedidoOut, status_code=status.HTTP_201_CREATED)
def crear_pedido(datos: PedidoIn, db: Session = Depends(get_db), cliente: Usuario = Depends(require_roles("cliente"))):
    """El servidor toma nombre y precio de cada producto desde la base de datos: nunca confía en los precios del cliente."""
    direccion = db.scalar(select(Direccion).where(Direccion.id == datos.direccion_id, Direccion.cliente_id == cliente.id))
    if direccion is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Selecciona o registra una dirección de entrega.")

    cantidades: dict[int, int] = {}
    for item in datos.items:  # si un producto viene repetido, se suman las cantidades
        cantidades[item.producto_id] = cantidades.get(item.producto_id, 0) + item.cantidad

    productos = {p.id: p for p in db.scalars(select(Producto).where(Producto.id.in_(list(cantidades)))).all()}
    for producto_id in cantidades:
        producto = productos.get(producto_id)
        if producto is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"El producto {producto_id} no existe.")
        if not producto.disponible:
            raise HTTPException(
                status.HTTP_409_CONFLICT, f'"{producto.nombre}" ya no está disponible. Quítalo del pedido para continuar.'
            )

    items = [
        PedidoItem(producto_id=pid, nombre=productos[pid].nombre, precio=productos[pid].precio, cantidad=cant)
        for pid, cant in cantidades.items()
    ]
    subtotal = sum(i.precio * i.cantidad for i in items)
    envio = calcular_envio(estrategia_envio_actual(db), subtotal)

    pedido = Pedido(
        estado=PENDIENTE,
        envio=envio,
        direccion=f"{direccion.direccion}, {direccion.ciudad}",
        cliente_id=cliente.id,
        cliente_nombre=cliente.nombre,
        cliente_telefono=cliente.telefono,
        items=items,
    )
    db.add(pedido)
    db.commit()
    return _salida(pedido)


@router.get("", response_model=list[PedidoOut])
def listar_pedidos(
    estado: str | None = Query(None, description="Filtra por estado: " + ", ".join(ESTADOS)),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Cada rol ve lo suyo: el cliente sus pedidos, el domiciliario los asignados a él, el administrador todos."""
    if estado is not None and estado not in ESTADOS:
        raise HTTPException(422, f"Estado inválido. Opciones: {', '.join(ESTADOS)}.")

    consulta = select(Pedido).order_by(Pedido.fecha.desc(), Pedido.id.desc())
    if usuario.rol == "cliente":
        consulta = consulta.where(Pedido.cliente_id == usuario.id)
    elif usuario.rol == "domiciliario":
        consulta = consulta.where(Pedido.domiciliario_id == domiciliario_de(db, usuario).id)
    if estado:
        consulta = consulta.where(Pedido.estado == estado)
    return [_salida(p) for p in db.scalars(consulta).unique().all()]


@router.get("/{pedido_id}", response_model=PedidoOut)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    pedido = _pedido_o_404(db, pedido_id)
    if usuario.rol == "cliente":
        permitido = pedido.cliente_id == usuario.id
    elif usuario.rol == "domiciliario":
        permitido = pedido.domiciliario_id == domiciliario_de(db, usuario).id
    else:
        permitido = True
    if not permitido:  # mismo 404 que si no existiera: no se revela que el pedido es de otra persona
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado.")
    return _salida(pedido)


@router.patch("/{pedido_id}/cancelar", response_model=PedidoOut)
def cancelar_pedido(pedido_id: int, db: Session = Depends(get_db), cliente: Usuario = Depends(require_roles("cliente"))):
    """RN-01: solo se cancela un pedido propio que siga Pendiente."""
    pedido = _pedido_o_404(db, pedido_id)
    if pedido.cliente_id != cliente.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado.")
    contexto = PedidoContext(pedido.estado)
    try:
        contexto.cancelar()
    except TransicionInvalida:
        raise HTTPException(status.HTTP_409_CONFLICT, "Este pedido ya no se puede cancelar porque dejó de estar pendiente.")
    pedido.estado = contexto.estado
    db.commit()
    return _salida(pedido)


@router.patch("/{pedido_id}/asignar", response_model=PedidoOut, dependencies=[Depends(require_roles("administrador"))])
def asignar_domiciliario(pedido_id: int, datos: AsignarIn, db: Session = Depends(get_db)):
    """Asigna un domiciliario disponible a un pedido Pendiente, que pasa a 'En preparación'."""
    pedido = _pedido_o_404(db, pedido_id)
    if not estado_de(pedido.estado).puede_asignar_domiciliario:
        raise HTTPException(status.HTTP_409_CONFLICT, "Solo se pueden asignar pedidos pendientes (no cancelados).")
    dom = db.get(Domiciliario, datos.domiciliario_id)
    if dom is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Domiciliario no encontrado.")
    if not dom.disponible:
        raise HTTPException(status.HTTP_409_CONFLICT, "El domiciliario no está disponible.")
    contexto = PedidoContext(pedido.estado)
    contexto.avanzar()
    pedido.estado = contexto.estado
    pedido.domiciliario_id = dom.id
    db.commit()
    return _salida(pedido)


@router.patch("/{pedido_id}/avanzar", response_model=PedidoOut)
def avanzar_entrega(pedido_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_roles("domiciliario"))):
    """El domiciliario asignado marca 'En camino' y luego 'Entregado'."""
    dom = domiciliario_de(db, usuario)
    pedido = _pedido_o_404(db, pedido_id)
    if pedido.domiciliario_id != dom.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado.")
    if not estado_de(pedido.estado).puede_marcar_entrega:
        raise HTTPException(status.HTTP_409_CONFLICT, "Este pedido no tiene acciones disponibles.")
    contexto = PedidoContext(pedido.estado)
    contexto.avanzar()
    pedido.estado = contexto.estado
    db.commit()
    return _salida(pedido)
