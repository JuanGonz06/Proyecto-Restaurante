import type { Rol } from '../store.service';

/**
 * PATRÓN FACTORY METHOD (creación)
 * Al iniciar sesión o registrarse, el sistema necesita un objeto de usuario del tipo correcto
 * (Cliente, Administrador o Domiciliario). El Store no usa `new Cliente(...)`: le pide el objeto
 * a la fábrica del rol. Agregar un rol nuevo (ej. Cajero) es agregar una clase y una fábrica,
 * sin tocar el código de login (OCP).
 *
 *   Product          → Usuario
 *   ConcreteProducts → Cliente, Administrador, Domiciliario
 *   Creator          → UsuarioFactory
 *   ConcreteCreators → ClienteFactory, AdminFactory, DomiciliarioFactory
 */
export interface DatosUsuario { nombre: string; email: string; telefono: string; password: string; }

/** Product */
export abstract class Usuario {
  abstract readonly rol: Rol;
  abstract readonly etiquetaRol: string;
  /** Pantalla a la que entra cada rol después del login (reemplaza un switch por rol). */
  abstract rutaInicial(): string;

  constructor(
    public readonly nombre: string,
    public readonly email: string,
    public readonly telefono: string,
    public readonly password: string,
  ) {}
}

/** ConcreteProducts */
export class Cliente extends Usuario {
  readonly rol: Rol = 'cliente';
  readonly etiquetaRol = 'Cliente';
  rutaInicial() { return '/cliente/menu'; }
}
export class Administrador extends Usuario {
  readonly rol: Rol = 'administrador';
  readonly etiquetaRol = 'Administrador';
  rutaInicial() { return '/admin/menu'; }
}
export class Domiciliario extends Usuario {
  readonly rol: Rol = 'domiciliario';
  readonly etiquetaRol = 'Domiciliario';
  rutaInicial() { return '/domiciliario/pedidos'; }
}

/** Creator */
export abstract class UsuarioFactory {
  abstract crearUsuario(datos: DatosUsuario): Usuario;
}

/** ConcreteCreators */
export class ClienteFactory extends UsuarioFactory {
  crearUsuario(d: DatosUsuario): Usuario { return new Cliente(d.nombre, d.email, d.telefono, d.password); }
}
export class AdminFactory extends UsuarioFactory {
  crearUsuario(d: DatosUsuario): Usuario { return new Administrador(d.nombre, d.email, d.telefono, d.password); }
}
export class DomiciliarioFactory extends UsuarioFactory {
  crearUsuario(d: DatosUsuario): Usuario { return new Domiciliario(d.nombre, d.email, d.telefono, d.password); }
}

const FABRICAS: Record<Rol, UsuarioFactory> = {
  cliente: new ClienteFactory(),
  administrador: new AdminFactory(),
  domiciliario: new DomiciliarioFactory(),
};

/** Devuelve la fábrica que corresponde al rol. */
export function fabricaPorRol(rol: Rol): UsuarioFactory {
  return FABRICAS[rol];
}
