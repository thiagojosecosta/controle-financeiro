import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { FinanceService } from '../../services/finance.service';
import { Transaction } from '../../models/transaction';
import { TransactionsComponent } from '../transactions/transactions';
import { isSameOrBeforeDay } from '../../utils/date.util';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, TransactionsComponent], // A importação do TransactionsComponent é essencial aqui
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.css'],
})
export class DashboardHomeComponent implements OnInit {
  currentUser: User | null = null;
  currentBalance = 0;
  monthlyIncome = 0;
  monthlyExpense = 0;
  recentTransactions: Transaction[] = [];

  isBalanceVisible = true;
  isTransactionModalOpen = false;
  isSidebarCollapsed = false;

  constructor(
    private authService: AuthService,
    private financeService: FinanceService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    const summary = this.financeService.getMonthlySummary();
    this.monthlyIncome = summary.income;
    this.monthlyExpense = summary.expense;
    this.currentBalance = summary.balance;
    this.loadRecentTransactions();
  }

  loadRecentTransactions() {
    const allTransactions = this.financeService.generateEffectiveTransactions();
    this.recentTransactions = allTransactions
      .filter((t) => isSameOrBeforeDay(t.date, new Date()))
      .slice(0, 5);
  }

  toggleBalanceVisibility(): void {
    this.isBalanceVisible = !this.isBalanceVisible;
  }

  openTransactionModal(): void {
    this.isTransactionModalOpen = true;
  }

  closeTransactionModal(): void {
    this.isTransactionModalOpen = false;
    this.loadFinancialData();
  }

  onTransactionSaved(): void {
    this.closeTransactionModal();
  }
}
