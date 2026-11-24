"""Gestión de domiciliarios por el administrador (HU-3.4)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.security import hash_password
from app.models import Domiciliario, Usuario
from app.schemas.domiciliario import DomiciliarioIn, DomiciliarioOut
from app.schemas.producto import DisponibilidadIn

router = APIRouter(prefix="/domiciliarios", tags=["Domiciliarios"], dependencies=[Depends(require_roles("administrador"))])


@router.get("", response_model=list[DomiciliarioOut])
def listar_domiciliarios(disponible: bool | None = None, db: Session = Depends(get_db)):
    consulta = select(Domiciliario).order_by(Domiciliario.id)
    if disponible is not None:
        consulta = consulta.where(Domiciliario.disponible.is_(disponible))
    return db.scalars(consulta).all()


@router.post("", response_model=DomiciliarioOut, status_code=status.HTTP_201_CREATED)
def crear_domiciliario(datos: DomiciliarioIn, db: Session = Depends(get_db)):
    """Crea el usuario (rol 'domiciliario') y su perfil de repartidor."""
    if db.scalar(select(Usuario.id).where(Usuario.email == datos.email)) or db.scalar(
        select(Domiciliario.id).where(Domiciliario.email == datos.email)
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese correo ya está registrado.")
    usuario = Usuario(
        nombre=datos.nombre,
        email=datos.email,
        telefono=datos.telefono,
        password_hash=hash_password(datos.password),
        rol="domiciliario",
    )
    db.add(usuario)
    db.flush()
    dom = Domiciliario(nombre=datos.nombre, telefono=datos.telefono, email=datos.email, disponible=True, usuario_id=usuario.id)
    db.add(dom)
    db.commit()
    return dom


@router.patch("/{domiciliario_id}/disponibilidad", response_model=DomiciliarioOut)
def cambiar_disponibilidad(domiciliario_id: int, datos: DisponibilidadIn, db: Session = Depends(get_db)):
    dom = db.get(Domiciliario, domiciliario_id)
    if dom is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Domiciliario no encontrado.")
    dom.disponible = datos.disponible
    db.commit()
    return dom
