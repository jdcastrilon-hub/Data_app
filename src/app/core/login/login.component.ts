import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LoginService } from '../services/core/login.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  // Controlamos la visualización de la clave con un Signal moderno de Angular
  ocultarClave = signal(true);

  constructor(private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      clave: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  conmutarVisibilidadClave(event: MouseEvent) {
    this.ocultarClave.update(v => !v);
    event.preventDefault(); // Evita que el botón dispare el envío del formulario
  }

  ingresar() {
    if (this.loginForm.valid) {
      const datosLogin = this.loginForm.value;
      console.log('Datos enviados:', datosLogin);
      // Aquí ejecutas el llamado a tu servicio de FastAPI
      this.loginService.login(datosLogin.usuario, datosLogin.clave).subscribe({
        next: (data) => {
          console.log(data);
          console.log('¡Login exitoso! Token guardado.');
          // Redirigimos a la ruta principal del ERP
          this.router.navigate(['/categorias']);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}