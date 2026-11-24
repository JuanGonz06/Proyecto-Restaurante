"""Menú: lectura pública y gestión por el administrador (HU-1.1, 4.2 a 4.5)."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models import PedidoItem, Producto
from app.schemas.producto import CATEGORIAS, DisponibilidadIn, ProductoIn, ProductoOut

router = APIRouter(prefix="/productos", tags=["Menú"])
solo_admin = Depends(require_roles("administrador"))


def _o_404(db: Session, producto_id: int) -> Producto:
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado.")
    return producto


@router.get("/categorias", response_model=list[str])
def listar_categorias():
    return CATEGORIAS


@router.get("", response_model=list[ProductoOut])
def listar_productos(
    categoria: str | None = None,
    solo_disponibles: bool = Query(False, alias="soloDisponibles"),
    db: Session = Depends(get_db),
):
    consulta = select(Producto).order_by(Producto.id)
    if categoria:
        consulta = consulta.where(Producto.categoria == categoria)
    if solo_disponibles:
        consulta = consulta.where(Producto.disponible.is_(True))
    return db.scalars(consulta).all()


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    return _o_404(db, producto_id)


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED, dependencies=[solo_admin])
def crear_producto(datos: ProductoIn, db: Session = Depends(get_db)):
    producto = Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    return producto


@router.put("/{producto_id}", response_model=ProductoOut, dependencies=[solo_admin])
def actualizar_producto(producto_id: int, datos: ProductoIn, db: Session = Depends(get_db)):
    producto = _o_404(db, producto_id)
    for campo, valor in datos.model_dump().items():
        setattr(producto, campo, valor)
    db.commit()
    return producto


@router.patch("/{producto_id}/disponibilidad", response_model=ProductoOut, dependencies=[solo_admin])
def cambiar_disponibilidad(producto_id: int, datos: DisponibilidadIn, db: Session = Depends(get_db)):
    producto = _o_404(db, producto_id)
    producto.disponible = datos.disponible
    db.commit()
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[solo_admin])
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = _o_404(db, producto_id)
    # Los pedidos ya hechos conservan nombre y precio; solo se suelta la referencia al producto.
    db.execute(update(PedidoItem).where(PedidoItem.producto_id == producto_id).values(producto_id=None))
    db.delete(producto)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
