"""Perfil del usuario autenticado (HU-2.4)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Domiciliario, Usuario
from app.schemas.auth import PerfilIn, UsuarioOut

router = APIRouter(prefix="/usuarios", tags=["Perfil"])


@router.get("/me", response_model=UsuarioOut)
def ver_perfil(usuario: Usuario = Depends(get_current_user)):
    return usuario


@router.put("/me", response_model=UsuarioOut)
def actualizar_perfil(datos: PerfilIn, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    usuario.nombre = datos.nombre
    usuario.telefono = datos.telefono
    if usuario.rol == "domiciliario":  # mantener sincronizado su perfil de repartidor
        dom = db.scalar(select(Domiciliario).where(Domiciliario.usuario_id == usuario.id))
        if dom:
            dom.nombre = datos.nombre
            dom.telefono = datos.telefono
    db.add(usuario)
    db.commit()
    return usuario
