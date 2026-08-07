import { Component, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent {
  // Deriva do sinal reativo do usuário, então atualiza sozinho quando o
  // perfil é editado em Configurações (sem precisar recarregar a página).
  userName = computed(
    () => this.authService.currentUser()?.nome?.split(' ')[0] || ''
  );
  userEmail = computed(() => this.authService.currentUser()?.email || '');
  userInitial = computed(() => {
    const nome = this.authService.currentUser()?.nome;
    return (nome ? nome.charAt(0) : '?').toUpperCase();
  });

  isSidebarCollapsed: boolean = true;
  isUserMenuOpen = false;
  searchQuery = '';

  theme;

  constructor(
    private authService: AuthService,
    private router: Router,
    private elRef: ElementRef,
    private themeService: ThemeService
  ) {
    this.theme = this.themeService.theme;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Fecha a gaveta lateral no mobile ao navegar para uma tela (no desktop
  // a sidebar expandida não deve fechar sozinha ao clicar num item).
  onNavClick(): void {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed = true;
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  onSearch(query: string): void {
    const q = query.trim();
    if (!q) return;
    this.router.navigate(['/dashboard/transactions'], { queryParams: { q } });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isUserMenuOpen) return;
    const menu = this.elRef.nativeElement.querySelector('.user-menu');
    if (menu && !menu.contains(event.target as Node)) {
      this.isUserMenuOpen = false;
    }
  }
}
