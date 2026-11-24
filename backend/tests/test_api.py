"""Pruebas de la API completa con SQLite temporal. Necesitan: pip install -r requirements-dev.txt"""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("sqlalchemy")
pytest.importorskip("httpx")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # abre el lifespan: crea tablas y datos de ejemplo
        yield c


def entrar(client, email, password="123456"):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['accessToken']}"}


def test_login_incorrecto(client):
    r = client.post("/api/auth/login", json={"email": "cliente@correo.com", "password": "mala"})
    assert r.status_code == 401
    r = client.post("/api/auth/login", json={"email": "nadie@correo.com", "password": "123456"})
    assert r.status_code == 401


def test_registro_y_correo_repetido(client):
    cuerpo = {"nombre": "Nuevo Cliente", "email": "nuevo@correo.com", "password": "secreta1"}
    r = client.post("/api/auth/registro", json=cuerpo)
    assert r.status_code == 201
    assert r.json()["usuario"]["rol"] == "cliente"
    assert client.post("/api/auth/registro", json=cuerpo).status_code == 409


def test_menu_es_publico_y_solo_admin_lo_modifica(client):
    assert client.get("/api/productos").status_code == 200
    assert client.get("/api/productos", params={"soloDisponibles": True}).json()
    nuevo = {"nombre": "Sopa del día", "categoria": "Entradas", "precio": 8000}
    assert client.post("/api/productos", json=nuevo).status_code == 401
    assert client.post("/api/productos", json=nuevo, headers=entrar(client, "cliente@correo.com")).status_code == 403
    r = client.post("/api/productos", json=nuevo, headers=entrar(client, "admin@correo.com"))
    assert r.status_code == 201
    assert client.delete(f"/api/productos/{r.json()['id']}", headers=entrar(client, "admin@correo.com")).status_code == 204


def test_flujo_completo_de_un_pedido(client):
    cli, admin, domi = (entrar(client, e) for e in ("cliente@correo.com", "admin@correo.com", "domi@correo.com"))

    principal = next(d for d in client.get("/api/direcciones", headers=cli).json() if d["principal"])
    r = client.post("/api/pedidos", headers=cli, json={"direccionId": principal["id"], "items": [{"productoId": 1, "cantidad": 2}]})
    assert r.status_code == 201, r.text
    pedido = r.json()
    assert (pedido["estado"], pedido["subtotal"], pedido["envio"], pedido["total"]) == ("Pendiente", 18000, 5000, 23000)

    # el cliente no puede asignar; el admin sí
    ruta = f"/api/pedidos/{pedido['id']}"
    assert client.patch(f"{ruta}/asignar", headers=cli, json={"domiciliarioId": 1}).status_code == 403
    r = client.patch(f"{ruta}/asignar", headers=admin, json={"domiciliarioId": 1})
    assert r.status_code == 200 and r.json()["estado"] == "En preparación"

    # ya no se puede cancelar (RN-01)
    assert client.patch(f"{ruta}/cancelar", headers=cli).status_code == 409

    # el domiciliario lo lleva hasta la entrega
    assert client.patch(f"{ruta}/avanzar", headers=domi).json()["estado"] == "En camino"
    assert client.patch(f"{ruta}/avanzar", headers=domi).json()["estado"] == "Entregado"
    assert client.patch(f"{ruta}/avanzar", headers=domi).status_code == 409


def test_cancelar_pedido_pendiente(client):
    cli = entrar(client, "cliente@correo.com")
    principal = next(d for d in client.get("/api/direcciones", headers=cli).json() if d["principal"])
    pedido = client.post("/api/pedidos", headers=cli, json={"direccionId": principal["id"], "items": [{"productoId": 6, "cantidad": 1}]}).json()
    r = client.patch(f"/api/pedidos/{pedido['id']}/cancelar", headers=cli)
    assert r.status_code == 200 and r.json()["estado"] == "Cancelado"


def test_producto_no_disponible_no_se_puede_pedir(client):
    cli = entrar(client, "cliente@correo.com")
    principal = next(d for d in client.get("/api/direcciones", headers=cli).json() if d["principal"])
    r = client.post("/api/pedidos", headers=cli, json={"direccionId": principal["id"], "items": [{"productoId": 4, "cantidad": 1}]})
    assert r.status_code == 409  # el salmón está agotado en los datos de ejemplo


def test_un_cliente_no_ve_pedidos_ajenos(client):
    luis = entrar(client, "otro@correo.com")
    ana = entrar(client, "cliente@correo.com")
    ids_de_luis = {p["id"] for p in client.get("/api/pedidos", headers=luis).json()}
    ids_de_ana = {p["id"] for p in client.get("/api/pedidos", headers=ana).json()}
    assert ids_de_luis and ids_de_ana and not ids_de_luis & ids_de_ana
    assert client.get(f"/api/pedidos/{next(iter(ids_de_luis))}", headers=ana).status_code == 404
    assert client.get("/api/pedidos").status_code == 401


def test_envio_gratis_cambia_el_costo(client):
    admin, cli = entrar(client, "admin@correo.com"), entrar(client, "cliente@correo.com")
    assert client.get("/api/envio/cotizar", params={"subtotal": 64000}).json()["envio"] == 5000
    assert client.put("/api/envio/estrategia", headers=admin, json={"id": "gratis"}).status_code == 200
    try:
        assert client.get("/api/envio/cotizar", params={"subtotal": 64000}).json()["envio"] == 0
        principal = next(d for d in client.get("/api/direcciones", headers=cli).json() if d["principal"])
        r = client.post("/api/pedidos", headers=cli, json={"direccionId": principal["id"], "items": [{"productoId": 3, "cantidad": 2}]})
        assert r.json()["envio"] == 0 and r.json()["total"] == 64000
    finally:
        client.put("/api/envio/estrategia", headers=admin, json={"id": "fija"})


def test_recuperar_contrasena(client):
    r = client.post("/api/auth/recuperar", json={"email": "otro@correo.com"}).json()
    assert r["resetToken"]
    nuevo = {"token": r["resetToken"], "password": "otraclave"}
    assert client.post("/api/auth/restablecer", json=nuevo).status_code == 204
    assert client.post("/api/auth/restablecer", json=nuevo).status_code == 400  # el token ya no sirve
    entrar(client, "otro@correo.com", "otraclave")
