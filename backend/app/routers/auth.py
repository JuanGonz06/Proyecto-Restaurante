"""Registro, inicio de sesión y recuperación de contraseña (HU-2.1, 2.2, 2.3, 2.5)."""
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import crear_token, decodificar_token, hash_password, verify_password
from app.models import Usuario
from app.schemas.auth import LoginIn, RecuperarIn, RecuperarOut, RegistroIn, RestablecerIn, TokenOut, UsuarioOut

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Se compara contra este hash cuando el correo no existe, para que el login tarde igual y no revele qué correos están registrados.
_HASH_FALSO = hash_password("contraseña-que-nadie-usa")


def _respuesta_token(usuario: Usuario) -> TokenOut:
    token = crear_token(usuario.id, "access", settings.access_token_minutos, rol=usuario.rol)
    return TokenOut(access_token=token, usuario=UsuarioOut.model_validate(usuario))


@router.post("/registro", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: RegistroIn, db: Session = Depends(get_db)):
    """Crea una cuenta de cliente. El rol siempre es 'cliente': administradores y domiciliarios los crea el sistema."""
    if db.scalar(select(Usuario.id).where(Usuario.email == datos.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese correo ya está registrado.")
    usuario = Usuario(
        nombre=datos.nombre,
        email=datos.email,
        telefono=datos.telefono,
        password_hash=hash_password(datos.password),
        rol="cliente",
    )
    db.add(usuario)
    try:
        db.commit()
    except IntegrityError:  # dos registros simultáneos con el mismo correo
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese correo ya está registrado.")
    return _respuesta_token(usuario)


@router.post("/login", response_model=TokenOut)
def iniciar_sesion(datos: LoginIn, db: Session = Depends(get_db)):
    usuario = db.scalar(select(Usuario).where(Usuario.email == datos.email))
    hash_guardado = usuario.password_hash if usuario else _HASH_FALSO
    if not verify_password(datos.password, hash_guardado) or usuario is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos.")
    return _respuesta_token(usuario)


@router.get("/me", response_model=UsuarioOut)
def usuario_actual(usuario: Usuario = Depends(get_current_user)):
    return usuario


@router.post("/recuperar", response_model=RecuperarOut)
def recuperar_contrasena(datos: RecuperarIn, db: Session = Depends(get_db)):
    """Genera un token de restablecimiento. Siempre responde igual, exista o no el correo."""
    usuario = db.scalar(select(Usuario).where(Usuario.email == datos.email))
    token = None
    if usuario and settings.es_desarrollo:
        # 'ph' liga el token a la contraseña actual: deja de servir apenas se cambia.
        token = crear_token(usuario.id, "reset", settings.reset_token_minutos, ph=usuario.password_hash[-12:])
    # En producción aquí se enviaría un correo con el enlace; sin servicio de correo, solo se responde el mensaje.
    return RecuperarOut(mensaje="Si el correo está registrado, recibirás instrucciones para restablecer la contraseña.", reset_token=token)


@router.post("/restablecer", status_code=status.HTTP_204_NO_CONTENT)
def restablecer_contrasena(datos: RestablecerIn, db: Session = Depends(get_db)):
    error = HTTPException(status.HTTP_400_BAD_REQUEST, "El enlace de recuperación no es válido o ya expiró.")
    try:
        payload = decodificar_token(datos.token, "reset")
        usuario = db.get(Usuario, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error
    if usuario is None or usuario.password_hash[-12:] != payload.get("ph"):
        raise error
    usuario.password_hash = hash_password(datos.password)
    db.commit()
