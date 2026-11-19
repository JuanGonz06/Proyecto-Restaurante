import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../store.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card auth">
      <h1>Crear cuenta</h1>
      <label class="field">Nombre *<input [(ngModel)]="nombre"></label>
      <label class="field">Correo *<input type="email" [(ngModel)]="email"></label>
      <label class="field">Teléfono<input [(ngModel)]="telefono" placeholder="3001234567"></label>
      <label class="field">Contraseña * (mínimo 6 caracteres)<input type="password" [(ngModel)]="password"></label>
      @if (error) { <div class="error">{{ error }}</div> }
      <button class="btn btn-primary" style="width:100%" (click)="registrar()">Registrarme</button>
      <p class="hint">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
    </div>
  `,
})
export class RegistroComponent {
  private store = inject(Store);
  private router = inject(Router);
  nombre = '';
  email = '';
  telefono = '';
  password = '';
  error = '';

  registrar() {
    if (!this.nombre.trim() || !this.email.trim() || !this.password) {
      this.error = 'Completa los campos obligatorios.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.error = 'El correo no tiene un formato válido.';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    const err = this.store.registrar(this.nombre, this.email, this.telefono, this.password);
    if (err) {
      this.error = err;
      return;
    }
    this.router.navigate(['/cliente/menu']);
  }
}
