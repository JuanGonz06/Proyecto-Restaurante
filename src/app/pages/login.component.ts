import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '../store.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card auth">
      <h1>🍽️ Iniciar sesión</h1>
      <label class="field">Correo<input type="email" [(ngModel)]="email" (keyup.enter)="entrar()"></label>
      <label class="field">Contraseña<input type="password" [(ngModel)]="password" (keyup.enter)="entrar()"></label>
      @if (error) { <div class="error">{{ error }}</div> }
      <button class="btn btn-primary" style="width:100%" (click)="entrar()">Entrar</button>
      <p class="row between">
        <a routerLink="/registro">Crear cuenta</a>
        <a routerLink="/recuperar">Olvidé mi contraseña</a>
      </p>
      <p class="hint">
        Usuarios de prueba (contraseña <b>123456</b>):<br>
        cliente&#64;correo.com · admin&#64;correo.com · domi&#64;correo.com
      </p>
    </div>
  `,
})
export class LoginComponent {
  private store = inject(Store);
  private router = inject(Router);
  email = '';
  password = '';
  error = '';

  entrar() {
    if (!this.email.trim() || !this.password) {
      this.error = 'Ingresa tu correo y tu contraseña.';
      return;
    }
    const err = this.store.login(this.email, this.password);
    if (err) {
      this.error = err;
      return;
    }
    this.router.navigate([this.store.usuario()!.rutaInicial()]); // cada rol sabe cuál es su pantalla inicial
  }
}
