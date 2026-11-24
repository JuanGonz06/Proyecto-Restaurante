"""Dependencias de FastAPI: usuario autenticado y control de acceso por rol."""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decodificar_token
from app.models import Domiciliario, Usuario

bearer = HTTPBearer(auto_error=False, description="Pega el accessToken que devuelve /api/auth/login")


def _no_autenticado() -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, "Debes iniciar sesión.", headers={"WWW-Authenticate": "Bearer"})


def get_current_user(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if credenciales is None:
        raise _no_autenticado()
    try:
        payload = decodificar_token(credenciales.credentials, "access")
        usuario_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _no_autenticado()
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise _no_autenticado()
    return usuario


def require_roles(*roles: str):
    """Permite el acceso solo a los roles indicados ('cliente', 'administrador', 'domiciliario')."""

    def dependencia(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para realizar esta acción.")
        return usuario

    return dependencia


def domiciliario_de(db: Session, usuario: Usuario) -> Domiciliario:
    """Perfil de domiciliario ligado al usuario con rol 'domiciliario'."""
    dom = db.scalar(select(Domiciliario).where(Domiciliario.usuario_id == usuario.id))
    if dom is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tu usuario no tiene un perfil de domiciliario.")
    return dom
