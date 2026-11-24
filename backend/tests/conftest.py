"""Configura una base de datos de prueba ANTES de importar la aplicación."""
import os
from pathlib import Path

_BD = Path(__file__).resolve().parent / "test_restaurante.db"
_BD.unlink(missing_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{_BD}"
os.environ["CARGAR_DATOS_EJEMPLO"] = "true"
os.environ["ENTORNO"] = "desarrollo"
