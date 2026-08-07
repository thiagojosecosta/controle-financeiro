// ARQUIVO: src/app/components/settings/settings.ts

import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class SettingsComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: User | null;

  // Propriedades para controlar a visibilidade da senha
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Cabeçalho visual do card de perfil (avatar-iniciais), reagindo ao mesmo
  // sinal de usuário logado da sidebar.
  profileName = computed(() => this.authService.currentUser()?.nome || '');
  profileEmail = computed(() => this.authService.currentUser()?.email || '');
  profileInitial = computed(() => {
    const nome = this.authService.currentUser()?.nome;
    return (nome ? nome.charAt(0) : '?').toUpperCase();
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      // Corrigido para 'nome' para ser consistente com o modelo de utilizador
      nome: ['', Validators.required],
      email: [{ value: '', disabled: true }],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );

    this.currentUser = null;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      // Preenche o formulário com os dados do utilizador
      this.profileForm.patchValue({
        nome: this.currentUser.nome, // Corrigido para preencher o nome
        email: this.currentUser.email,
      });
    }

    this.route.queryParams.subscribe((params) => {
      if (params['section'] === 'password') {
        setTimeout(() => {
          document
            .getElementById('password-card')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  onProfileSubmit(): void {
    if (this.profileForm.invalid) {
      this.notificationService.show(
        'Por favor, preencha os campos corretamente.',
        'error'
      );
      return;
    }

    if (this.currentUser) {
      const updatedUser: User = {
        ...this.currentUser,
        nome: this.profileForm.value.nome,
      };

      if (this.authService.updateUser(updatedUser)) {
        this.notificationService.show(
          'Perfil atualizado com sucesso!',
          'success'
        );
        this.profileForm.markAsPristine(); // Marca o formulário como "não modificado"
      } else {
        this.notificationService.show(
          'Ocorreu um erro ao atualizar o perfil.',
          'error'
        );
      }
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.notificationService.show(
        'Por favor, verifique os campos do formulário de senha.',
        'error'
      );
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.value;
    if (this.authService.changePassword(currentPassword, newPassword)) {
      this.notificationService.show('Senha alterada com sucesso!', 'success');
      this.passwordForm.reset();
    }
    // A notificação de erro já é tratada dentro do authService
  }
}
