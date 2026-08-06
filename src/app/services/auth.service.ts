// ARQUIVO: src/app/services/auth.service.ts

import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service'; // Importe o serviço de notificação

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private USERS_KEY = 'financial_app_users';
  private SESSION_KEY = 'financial_app_session';
  private isBrowser: boolean;

  // Sinal reativo com o usuário logado, para que a UI (ex: cabeçalho) se
  // atualize automaticamente quando o perfil mudar, sem precisar recarregar a página.
  readonly currentUser = signal<User | null>(null);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private router: Router,
    private notificationService: NotificationService // Injete o serviço
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.currentUser.set(this.getCurrentUser());
  }

  // --- LÓGICA DE LOGIN CORRIGIDA ---
  login(credentials: { email: string; pass: string }): boolean {
    const users = this.getUsers();

    // CORREÇÃO: Compara credentials.pass com u.password
    const user = users.find(
      (u) => u.email === credentials.email && u.password === credentials.pass
    );

    if (user) {
      if (this.isBrowser) {
        // Remove a senha antes de salvar na sessão por segurança
        const { password, ...userToStore } = user;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(userToStore));
        this.currentUser.set(userToStore as User);
      }
      return true;
    }

    // Se o login falhar, mostra uma notificação
    this.notificationService.show('Email ou senha inválidos.', 'error');
    return false;
  }

  // ... resto dos seus métodos (register, logout, etc.) ...

  register(user: User): boolean {
    const users = this.getUsers();
    const userExists = users.some((u) => u.email === user.email);
    if (userExists) {
      this.notificationService.show('Este email já está cadastrado.', 'error');
      return false;
    }
    users.push(user);
    this.saveUsers(users);
    return true;
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.SESSION_KEY);
    }
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  getCurrentUser(): User | null {
    if (!this.isBrowser) return null;
    const userJson = localStorage.getItem(this.SESSION_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  updateUser(updatedUser: User): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === updatedUser.id);
    if (userIndex === -1) return false;

    const userInDb = users[userIndex];
    userInDb.nome = updatedUser.nome;

    this.saveUsers(users);

    if (this.isBrowser) {
      const { password, ...userToStore } = userInDb;
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(userToStore));
      this.currentUser.set(userToStore as User);
    }
    return true;
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const users = this.getUsers();
    const userInDb = users.find((u) => u.id === currentUser.id);

    if (!userInDb || userInDb.password !== currentPassword) {
      this.notificationService.show('A senha atual está incorreta.', 'error');
      return false;
    }

    userInDb.password = newPassword;
    this.saveUsers(users);
    return true;
  }

  private getUsers(): User[] {
    if (!this.isBrowser) return [];
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private saveUsers(users: User[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }
}
