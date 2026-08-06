// ARQUIVO: src/app/components/register/register.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

// Função validadora customizada
export function senhasCoincidemValidator(control: AbstractControl) {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { naoCoincidem: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        nome: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        senha: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            ),
          ],
        ],
        confirmarSenha: ['', [Validators.required]],
      },
      { validators: senhasCoincidemValidator }
    );
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    const { confirmarSenha, ...userData } = this.registerForm.value;
    const userToRegister: Partial<User> = {
      id: `user_${new Date().getTime()}`,
      nome: userData.nome,
      email: userData.email,
      password: userData.senha,
    };

    const success = this.authService.register(userToRegister as User);

    if (success) {
      this.router.navigate(['/login'], {
        queryParams: { registered: 'true' },
      });
    }
  }
}
