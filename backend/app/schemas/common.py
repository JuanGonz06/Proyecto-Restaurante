"""Base de los schemas: el JSON usa camelCase (igual que las interfaces del frontend Angular)."""
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from pydantic.alias_generators import to_camel

EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


def _strip(valor):
    return valor.strip() if isinstance(valor, str) else valor


def _correo(valor):
    return valor.strip().lower() if isinstance(valor, str) else valor


# Texto sin espacios al inicio/final (la contraseña NO usa este tipo: se respeta tal cual).
Limpio = Annotated[str, BeforeValidator(_strip)]
# Correo en minúsculas y con formato válido.
Correo = Annotated[str, BeforeValidator(_correo), Field(pattern=EMAIL_REGEX, max_length=150)]
# Correo para el login: solo se normaliza, sin validar formato.
CorreoLogin = Annotated[str, BeforeValidator(_correo)]
