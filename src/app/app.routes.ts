// src/app/app.routes.ts


import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home';
import { TransactionsComponent } from './components/transactions/transactions';
import { ReportsComponent } from './components/reports/reports';
import { CategoriesComponent } from './components/categories/categories';
import { GoalsComponent } from './components/goals/goals';
import { SettingsComponent } from './components/settings/settings';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // Protege o acesso ao dashboard
    children: [
      { path: 'home', component: DashboardHomeComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'goals', component: GoalsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  // Redireciona qualquer outra rota para a página inicial
  { path: '**', redirectTo: '' },
];
