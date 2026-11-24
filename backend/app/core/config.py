"""Configuración leída de variables de entorno (y del archivo backend/.env si existe)."""
import os
from pathlib import Path

CLAVE_POR_DEFECTO = "clave-solo-para-desarrollo-cambiar-en-produccion-123"


def _cargar_env(ruta: Path) -> None:
    """Carga un .env sencillo (CLAVE=valor). Las variables ya definidas en el entorno tienen prioridad."""
    if not ruta.exists():
        return
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        os.environ.setdefault(clave.strip(), valor.strip().strip('"').strip("'"))


_cargar_env(Path(__file__).resolve().parents[2] / ".env")


def _bool(nombre: str, defecto: str) -> bool:
    return os.getenv(nombre, defecto).strip().lower() in ("1", "true", "si", "sí", "yes")


class Settings:
    def __init__(self) -> None:
        self.entorno = os.getenv("ENTORNO", "desarrollo")
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./restaurante.db")
        self.secret_key = os.getenv("SECRET_KEY", CLAVE_POR_DEFECTO)
        self.access_token_minutos = int(os.getenv("ACCESS_TOKEN_MINUTOS", str(60 * 8)))
        self.reset_token_minutos = int(os.getenv("RESET_TOKEN_MINUTOS", "15"))
        self.cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",") if o.strip()]
        self.cargar_datos_ejemplo = _bool("CARGAR_DATOS_EJEMPLO", "true")

        if self.entorno != "desarrollo" and self.secret_key == CLAVE_POR_DEFECTO:
            raise RuntimeError("Define SECRET_KEY en el entorno: no se puede usar la clave por defecto fuera de desarrollo.")

    @property
    def es_desarrollo(self) -> bool:
        return self.entorno == "desarrollo"


settings = Settings()
