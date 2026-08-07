// ARQUIVO: src/app/components/login/login.ts

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit {
  credentials = { email: '', pass: '' };
  showPassword = false;
  theme;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private route: ActivatedRoute, // Injeta o serviço para ler a URL
    private themeService: ThemeService
  ) {
    this.theme = this.themeService.theme;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  ngOnInit(): void {
    // ESTE BLOCO É O RESPONSÁVEL POR LER O AVISO
    this.route.queryParams.subscribe((params) => {
      // Verifica se o parâmetro 'registered' existe na URL
      if (params['registered'] === 'true') {
        // Se existir, mostra a notificação de sucesso
        this.notificationService.show(
          'Conta criada com sucesso! Faça o login para continuar.',
          'success'
        );

        // Limpa a URL para que a mensagem não apareça novamente se o utilizador atualizar a página
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { registered: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  onSubmit(): void {
    const loginSuccess = this.authService.login(this.credentials);
    if (loginSuccess) {
      this.router.navigate(['/dashboard/home']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
