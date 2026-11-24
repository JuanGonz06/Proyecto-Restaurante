# Backend – Proyecto Restaurante

API REST para el frontend Angular (`PedidosFront`). Reemplaza el `Store` en memoria del front por datos reales en base de datos.

**Stack:** FastAPI · SQLAlchemy 2 · PostgreSQL (Neon) · JWT. Python 3.11 o superior.

## Puesta en marcha

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # Linux/Mac: cp .env.example .env
uvicorn app.main:app --reload
```

- Documentación interactiva (Swagger): <http://localhost:8000/docs>
- Por defecto usa SQLite local (`restaurante.db`). Para Neon, pon tu cadena en `DATABASE_URL` dentro de `.env`.
- Al arrancar crea las tablas y, si la base está vacía, carga los mismos datos de ejemplo del front.

### Cuentas de ejemplo (contraseña `123456`)

| Rol | Correo |
|---|---|
| Cliente | `cliente@correo.com` (con 2 direcciones y pedidos) · `otro@correo.com` |
| Administrador | `admin@correo.com` |
| Domiciliario | `domi@correo.com` |

En Swagger: `POST /api/auth/login` → copia `accessToken` → botón **Authorize**.

## Endpoints (prefijo `/api`)

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /auth/registro` | público | Crea cliente y devuelve token |
| `POST /auth/login` | público | Devuelve `accessToken` y `usuario` |
| `GET /auth/me` | autenticado | Usuario actual |
| `POST /auth/recuperar` · `POST /auth/restablecer` | público | Recuperar contraseña con token de 15 min |
| `GET/PUT /usuarios/me` | autenticado | Ver y editar perfil (nombre, teléfono) |
| `GET /productos` (`?categoria=`, `?soloDisponibles=`) · `GET /productos/{id}` · `GET /productos/categorias` | público | Menú |
| `POST /productos` · `PUT /productos/{id}` · `DELETE /productos/{id}` · `PATCH /productos/{id}/disponibilidad` | administrador | Gestión del menú |
| `GET/POST /direcciones` · `PATCH /direcciones/{id}/principal` · `DELETE /direcciones/{id}` | cliente | Direcciones de entrega |
| `POST /pedidos` | cliente | Crea el pedido (precios y envío los calcula el servidor) |
| `GET /pedidos` (`?estado=`) · `GET /pedidos/{id}` | todos | Cada rol ve solo lo suyo; el admin ve todos |
| `PATCH /pedidos/{id}/cancelar` | cliente | Solo si está *Pendiente* (RN-01) |
| `PATCH /pedidos/{id}/asignar` | administrador | Asigna domiciliario disponible → *En preparación* |
| `PATCH /pedidos/{id}/avanzar` | domiciliario | *En camino* → *Entregado* |
| `GET/POST /domiciliarios` · `PATCH /domiciliarios/{id}/disponibilidad` | administrador | Gestión de repartidores |
| `GET /envio/estrategias` · `GET /envio/cotizar?subtotal=` | público | Costo de envío vigente |
| `PUT /envio/estrategia` | administrador | Cambia entre tarifa fija y envío gratis desde $60.000 |

El JSON usa **camelCase** (`clienteEmail`, `domiciliarioId`, `productoId`…) igual que las interfaces de `store.service.ts`. Los errores vienen como `{"detail": "mensaje"}`.

## Estructura

```
app/
  core/        config, base de datos, seguridad (hash + JWT), dependencias de rol
  models/      tablas SQLAlchemy
  schemas/     validación de entrada y salida (Pydantic)
  services/    reglas de negocio: estado_pedido.py (State) y envio.py (Strategy)
  routers/     endpoints
  seed.py      datos de ejemplo
tests/         pruebas
```

## Pruebas

```bash
pip install -r requirements-dev.txt
pytest
```

## Producción

- `ENTORNO=produccion` y una `SECRET_KEY` propia (obligatoria; la app no arranca sin ella).
- `CARGAR_DATOS_EJEMPLO=false` para no crear las cuentas con contraseña `123456`.
- `CORS_ORIGINS` con la URL real del front.
- Las tablas se crean con `create_all`; si el esquema cambia más adelante, conviene añadir Alembic.
