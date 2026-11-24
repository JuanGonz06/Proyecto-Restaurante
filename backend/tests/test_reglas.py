"""Pruebas de las reglas de negocio puras (no necesitan base de datos ni servidor)."""
import jwt
import pytest
from pydantic import ValidationError

from app.core.security import crear_token, decodificar_token, hash_password, verify_password
from app.schemas.auth import RegistroIn
from app.schemas.pedido import PedidoIn, PedidoOut
from app.schemas.producto import ProductoIn
from app.services.envio import EnvioGratis, EnvioTarifaFija, calcular_envio, obtener_estrategia
from app.services.estado_pedido import (
    CANCELADO, EN_CAMINO, EN_PREPARACION, ENTREGADO, PENDIENTE, PedidoContext, TransicionInvalida, estado_de,
)


# ---------- State ----------
def test_flujo_completo_de_un_pedido():
    ctx = PedidoContext(PENDIENTE)
    ctx.avanzar()
    assert ctx.estado == EN_PREPARACION
    ctx.avanzar()
    assert ctx.estado == EN_CAMINO
    ctx.avanzar()
    assert ctx.estado == ENTREGADO


def test_solo_se_cancela_un_pedido_pendiente():
    ctx = PedidoContext(PENDIENTE)
    ctx.cancelar()
    assert ctx.estado == CANCELADO
    for estado in (EN_PREPARACION, EN_CAMINO, ENTREGADO, CANCELADO):
        with pytest.raises(TransicionInvalida):
            PedidoContext(estado).cancelar()


def test_estados_finales_no_avanzan():
    for estado in (ENTREGADO, CANCELADO):
        with pytest.raises(TransicionInvalida):
            PedidoContext(estado).avanzar()


def test_permisos_por_estado():
    assert estado_de(PENDIENTE).puede_asignar_domiciliario
    assert not estado_de(EN_PREPARACION).puede_asignar_domiciliario
    assert estado_de(EN_PREPARACION).puede_marcar_entrega
    assert estado_de(EN_CAMINO).puede_marcar_entrega
    assert not estado_de(ENTREGADO).puede_marcar_entrega


def test_estado_desconocido():
    with pytest.raises(ValueError):
        estado_de("Inventado")


# ---------- Strategy ----------
def test_tarifa_fija():
    assert calcular_envio(EnvioTarifaFija(), 10000) == 5000
    assert calcular_envio(EnvioTarifaFija(), 500000) == 5000


def test_envio_gratis_desde_60000():
    estrategia = EnvioGratis()
    assert calcular_envio(estrategia, 59999) == 5000
    assert calcular_envio(estrategia, 60000) == 0


def test_carrito_vacio_no_cobra_envio():
    assert calcular_envio(EnvioTarifaFija(), 0) == 0


def test_estrategia_desconocida_usa_tarifa_fija():
    assert obtener_estrategia("no-existe").id == "fija"


# ---------- Seguridad ----------
def test_hash_y_verificacion_de_contrasena():
    almacenado = hash_password("123456")
    assert almacenado != "123456"
    assert verify_password("123456", almacenado)
    assert not verify_password("654321", almacenado)
    assert not verify_password("123456", "formato-invalido")


def test_dos_hash_de_la_misma_contrasena_son_distintos():
    assert hash_password("123456") != hash_password("123456")


def test_token_de_acceso_no_sirve_como_token_de_recuperacion():
    token = crear_token(7, "access", 5)
    assert decodificar_token(token, "access")["sub"] == "7"
    with pytest.raises(jwt.PyJWTError):
        decodificar_token(token, "reset")


def test_token_expirado():
    with pytest.raises(jwt.ExpiredSignatureError):
        decodificar_token(crear_token(1, "access", -1), "access")


# ---------- Schemas ----------
def test_registro_normaliza_correo_y_espacios():
    datos = RegistroIn(nombre="  Ana Gómez ", email="  ANA@Correo.COM ", password="123456")
    assert datos.nombre == "Ana Gómez"
    assert datos.email == "ana@correo.com"
    assert datos.telefono == ""


def test_registro_rechaza_correo_y_clave_invalidos():
    with pytest.raises(ValidationError):
        RegistroIn(nombre="Ana", email="no-es-un-correo", password="123456")
    with pytest.raises(ValidationError):
        RegistroIn(nombre="Ana", email="ana@correo.com", password="123")


def test_el_json_acepta_camel_case():
    datos = RegistroIn.model_validate({"nombre": "Ana", "email": "ana@correo.com", "password": "123456"})
    assert datos.nombre == "Ana"
    pedido = PedidoIn.model_validate({"direccionId": 1, "items": [{"productoId": 3, "cantidad": 2}]})
    assert pedido.direccion_id == 1
    assert pedido.items[0].producto_id == 3


def test_pedido_exige_items_y_cantidades_validas():
    with pytest.raises(ValidationError):
        PedidoIn.model_validate({"direccionId": 1, "items": []})
    with pytest.raises(ValidationError):
        PedidoIn.model_validate({"direccionId": 1, "items": [{"productoId": 3, "cantidad": 0}]})


def test_producto_valida_categoria_y_precio():
    base = {"nombre": "Sopa", "categoria": "Entradas", "precio": 8000}
    assert ProductoIn.model_validate(base).disponible is True
    with pytest.raises(ValidationError):
        ProductoIn.model_validate({**base, "categoria": "Otra"})
    with pytest.raises(ValidationError):
        ProductoIn.model_validate({**base, "precio": 0})


def test_pedido_out_se_serializa_en_camel_case_y_con_zona_horaria():
    class Item:
        producto_id, nombre, precio, cantidad = 1, "Empanadas", 9000, 2

    class Pedido:
        from datetime import datetime
        id, estado, envio, direccion = 5, "Pendiente", 5000, "Cra 1, Medellín"
        cliente_email, cliente_nombre, cliente_telefono = "a@b.co", "Ana", ""
        domiciliario_id, subtotal, total = None, 18000, 23000
        fecha = datetime(2026, 10, 1, 12, 30)  # sin zona, como lo devuelve SQLite
        items = [Item()]

    salida = PedidoOut.model_validate(Pedido()).model_dump(by_alias=True, mode="json")
    assert salida["clienteEmail"] == "a@b.co"
    assert salida["domiciliarioId"] is None
    assert salida["items"][0]["productoId"] == 1
    assert salida["fecha"].endswith("Z") or salida["fecha"].endswith("+00:00")
