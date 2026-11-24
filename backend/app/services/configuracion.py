"""Lectura y escritura de la estrategia de envío vigente (tabla configuracion)."""
from sqlalchemy.orm import Session

from app.models import Configuracion
from app.services.envio import ESTRATEGIA_POR_DEFECTO, obtener_estrategia

CLAVE_ENVIO = "estrategia_envio"


def estrategia_envio_actual(db: Session):
    fila = db.get(Configuracion, CLAVE_ENVIO)
    return obtener_estrategia(fila.valor if fila else ESTRATEGIA_POR_DEFECTO)


def guardar_estrategia_envio(db: Session, estrategia_id: str) -> None:
    fila = db.get(Configuracion, CLAVE_ENVIO)
    if fila is None:
        db.add(Configuracion(clave=CLAVE_ENVIO, valor=estrategia_id))
    else:
        fila.valor = estrategia_id
    db.commit()
