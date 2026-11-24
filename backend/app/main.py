from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  (registra las tablas en Base.metadata)
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.routers import auth, direcciones, domiciliarios, envio, pedidos, productos, usuarios
from app.seed import cargar_datos_ejemplo


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.cargar_datos_ejemplo:
        with SessionLocal() as db:
            cargar_datos_ejemplo(db)
    yield


app = FastAPI(
    title="API del Restaurante",
    description="Backend del sistema de pedidos: menú, direcciones, pedidos, domiciliarios y costo de envío.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth, usuarios, productos, direcciones, domiciliarios, envio, pedidos):
    app.include_router(router.router, prefix="/api")


@app.get("/api/health", tags=["Sistema"])
def health():
    return {"estado": "ok"}
