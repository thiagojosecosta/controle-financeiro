import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { FinanceService, CategorySpending } from '../../services/finance.service';
import { Transaction } from '../../models/transaction';
import { TransactionsComponent } from '../transactions/transactions';
import { isSameOrBeforeDay, getDatePart } from '../../utils/date.util';

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
  savingsRate = 0;
  recentTransactions: Transaction[] = [];
  categorySpending: CategorySpending[] = [];
  uncategorizedCount = 0;

  selectedMonth = new Date();

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

  get greeting(): string {
    const hour = new Date().getHours();
    const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = this.currentUser?.nome?.split(' ')[0] || '';
    return firstName ? `${period}, ${firstName}` : period;
  }

  get monthLabel(): string {
    const label = this.selectedMonth.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  previousMonth(): void {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() - 1,
      1
    );
    this.loadFinancialData();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1,
      1
    );
    this.loadFinancialData();
  }

  loadFinancialData(): void {
    const summary = this.financeService.getMonthlySummary(this.selectedMonth);
    this.monthlyIncome = summary.income;
    this.monthlyExpense = summary.expense;
    this.currentBalance = summary.balance;
    this.savingsRate =
      this.monthlyIncome > 0
        ? ((this.monthlyIncome - this.monthlyExpense) / this.monthlyIncome) * 100
        : 0;
    this.loadRecentTransactions();
    this.categorySpending = this.financeService.getCategorySpendingSummary(
      this.selectedMonth
    );
    this.loadUncategorizedCount();
  }

  loadUncategorizedCount(): void {
    const targetMonth = this.selectedMonth.getMonth();
    const targetYear = this.selectedMonth.getFullYear();
    this.uncategorizedCount = this.financeService
      .generateEffectiveTransactions()
      .filter((t) => {
        const { year, month } = getDatePart(t.date);
        return (
          t.type === 'expense' &&
          !t.categoryId &&
          month === targetMonth &&
          year === targetYear
        );
      }).length;
  }

  progressBarClass(percentUsed: number | null): string {
    if (percentUsed === null) return '';
    if (percentUsed > 100) return 'over';
    if (percentUsed >= 80) return 'warning';
    return 'ok';
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
