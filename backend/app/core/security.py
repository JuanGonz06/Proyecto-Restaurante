"""Hash de contraseñas (scrypt, solo librería estándar) y tokens JWT."""
import base64
import hashlib
import hmac
import os
from datetime import timedelta

import jwt

from app.core.config import settings
from app.core.utils import ahora_utc

ALGORITMO = "HS256"
_N, _R, _P = 2**14, 8, 1


def _b64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    derivada = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P)
    return f"scrypt${_b64(salt)}${_b64(derivada)}"


def verify_password(password: str, almacenado: str) -> bool:
    try:
        esquema, salt_b64, hash_b64 = almacenado.split("$")
        if esquema != "scrypt":
            return False
        salt = base64.b64decode(salt_b64)
        esperado = base64.b64decode(hash_b64)
    except ValueError:
        return False
    derivada = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=_N, r=_R, p=_P)
    return hmac.compare_digest(derivada, esperado)


def crear_token(sub: int, tipo: str, minutos: int, **extra: str) -> str:
    """tipo: 'access' (sesión) o 'reset' (recuperar contraseña). Un token de un tipo no sirve para el otro."""
    ahora = ahora_utc()
    payload = {"sub": str(sub), "type": tipo, "iat": ahora, "exp": ahora + timedelta(minutes=minutos), **extra}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITMO)


def decodificar_token(token: str, tipo: str) -> dict:
    """Lanza jwt.PyJWTError si el token es inválido, expiró o es de otro tipo."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITMO])
    if payload.get("type") != tipo:
        raise jwt.InvalidTokenError("Tipo de token incorrecto.")
    return payload
