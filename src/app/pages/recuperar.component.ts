import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '../store.service';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card auth">
      <h1>Recuperar contraseña</h1>

      @if (paso === 1) {
        <p class="hint">Escribe tu correo y te enviaremos un enlace para restablecerla.</p>
        <label class="field">Correo<input type="email" [(ngModel)]="email"></label>
        @if (error) { <div class="error">{{ error }}</div> }
        <button class="btn btn-primary" style="width:100%" (click)="enviar()">Enviar enlace</button>
      }

      @if (paso === 2) {
        <div class="okmsg">Enviamos un enlace a {{ email }}. (Simulado: continúa aquí abajo.)</div>
        <label class="field">Nueva contraseña (mínimo 6)<input type="password" [(ngModel)]="nueva"></label>
        <label class="field">Confirmar contraseña<input type="password" [(ngModel)]="confirmar"></label>
        @if (error) { <div class="error">{{ error }}</div> }
        <div class="row">
          <button class="btn btn-primary" (click)="restablecer()">Restablecer</button>
          <button class="btn" (click)="vencido()">Simular enlace vencido</button>
        </div>
      }

      @if (paso === 3) {
        <div class="okmsg">Tu contraseña fue actualizada. Ya puedes iniciar sesión.</div>
      }

      <p class="hint"><a routerLink="/login">Volver al inicio de sesión</a></p>
    </div>
  `,
})
export class RecuperarComponent {
  private store = inject(Store);
  paso = 1;
  email = '';
  nueva = '';
  confirmar = '';
  error = '';

  enviar() {
    if (!this.email.trim()) { this.error = 'Ingresa tu correo.'; return; }
    if (!this.store.correoRegistrado(this.email)) { this.error = 'Ese correo no está registrado.'; return; }
    this.error = '';
    this.paso = 2;
  }

  restablecer() {
    if (this.nueva.length < 6) { this.error = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    if (this.nueva !== this.confirmar) { this.error = 'Las contraseñas no coinciden.'; return; }
    this.store.cambiarPassword(this.email, this.nueva);
    this.error = '';
    this.paso = 3;
  }

  vencido() {
    this.error = 'El enlace venció. Solicita uno nuevo.';
    this.paso = 1;
  }
}
