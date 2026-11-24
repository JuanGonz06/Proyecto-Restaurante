from pydantic import Field

from app.schemas.common import CamelModel, Correo, CorreoLogin, Limpio


class UsuarioOut(CamelModel):
    id: int
    nombre: str
    email: str
    telefono: str
    rol: str


class RegistroIn(CamelModel):
    nombre: Limpio = Field(min_length=2, max_length=100)
    email: Correo
    telefono: Limpio = Field(default="", max_length=30)
    password: str = Field(min_length=6, max_length=128)


class LoginIn(CamelModel):
    email: CorreoLogin
    password: str = Field(max_length=128)


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut


class PerfilIn(CamelModel):
    nombre: Limpio = Field(min_length=2, max_length=100)
    telefono: Limpio = Field(default="", max_length=30)


class RecuperarIn(CamelModel):
    email: CorreoLogin


class RecuperarOut(CamelModel):
    mensaje: str
    # Solo se devuelve en ENTORNO=desarrollo (en producción se enviaría por correo).
    reset_token: str | None = None


class RestablecerIn(CamelModel):
    token: str
    password: str = Field(min_length=6, max_length=128)
