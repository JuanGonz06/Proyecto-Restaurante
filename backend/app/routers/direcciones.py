"""Direcciones de entrega del cliente (HU-3.1)."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models import Direccion, Usuario
from app.schemas.direccion import DireccionIn, DireccionOut

router = APIRouter(prefix="/direcciones", tags=["Direcciones"])


def _mias(db: Session, cliente: Usuario) -> list[Direccion]:
    return list(db.scalars(select(Direccion).where(Direccion.cliente_id == cliente.id).order_by(Direccion.id)).all())


def _propia_o_404(db: Session, cliente: Usuario, direccion_id: int) -> Direccion:
    direccion = db.scalar(select(Direccion).where(Direccion.id == direccion_id, Direccion.cliente_id == cliente.id))
    if direccion is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dirección no encontrada.")
    return direccion


@router.get("", response_model=list[DireccionOut])
def listar_direcciones(db: Session = Depends(get_db), cliente: Usuario = Depends(require_roles("cliente"))):
    return _mias(db, cliente)


@router.post("", response_model=DireccionOut, status_code=status.HTTP_201_CREATED)
def crear_direccion(datos: DireccionIn, db: Session = Depends(get_db), cliente: Usuario = Depends(require_roles("cliente"))):
    existentes = _mias(db, cliente)
    principal = datos.principal or not existentes  # la primera dirección siempre es la principal
    if principal:
        for d in existentes:
            d.principal = False
    nueva = Direccion(cliente_id=cliente.id, **datos.model_dump(exclude={"principal"}), principal=principal)
    db.add(nueva)
    db.commit()
    return nueva


@router.patch("/{direccion_id}/principal", response_model=DireccionOut)
def marcar_principal(direccion_id: int, db: Session = Depends(get_db), cliente: Usuario = Depends(require_roles("cliente"))):
    elegida = _propia_o_404(db, cliente, direccion_id)
    for d in _mias(db, cliente):
        d.principal = d.id == elegida.id
    db.commit()
    return elegida


@router.delete("/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_direccion(direccion_id: int, db: Session = Depends(get_db), cliente: Usuario = Depends(require_roles("cliente"))):
    direccion = _propia_o_404(db, cliente, direccion_id)
    era_principal = direccion.principal
    db.delete(direccion)
    db.flush()
    if era_principal:
        restantes = _mias(db, cliente)
        if restantes:
            restantes[0].principal = True
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
