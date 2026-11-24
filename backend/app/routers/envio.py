"""Costo de envío: cotización pública y cambio de estrategia por el administrador."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.schemas.envio import CotizacionOut, EstrategiaIn, EstrategiaOut
from app.services.configuracion import estrategia_envio_actual, guardar_estrategia_envio
from app.services.envio import ESTRATEGIAS, calcular_envio

router = APIRouter(prefix="/envio", tags=["Envío"])


def _listado(db: Session) -> list[EstrategiaOut]:
    actual = estrategia_envio_actual(db).id
    return [EstrategiaOut(id=e.id, etiqueta=e.etiqueta, activa=e.id == actual) for e in ESTRATEGIAS.values()]


@router.get("/estrategias", response_model=list[EstrategiaOut])
def listar_estrategias(db: Session = Depends(get_db)):
    return _listado(db)


@router.put("/estrategia", response_model=list[EstrategiaOut], dependencies=[Depends(require_roles("administrador"))])
def cambiar_estrategia(datos: EstrategiaIn, db: Session = Depends(get_db)):
    if datos.id not in ESTRATEGIAS:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Estrategia desconocida. Opciones: {', '.join(ESTRATEGIAS)}.")
    guardar_estrategia_envio(db, datos.id)
    return _listado(db)


@router.get("/cotizar", response_model=CotizacionOut)
def cotizar(subtotal: int = Query(..., ge=0), db: Session = Depends(get_db)):
    """Total del carrito con la estrategia vigente (el carrito vive en el front)."""
    envio = calcular_envio(estrategia_envio_actual(db), subtotal)
    return CotizacionOut(subtotal=subtotal, envio=envio, total=subtotal + envio)
