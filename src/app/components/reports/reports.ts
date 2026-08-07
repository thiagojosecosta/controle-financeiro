// ARQUIVO: src/app/components/reports/reports.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Transaction } from '../../models/transaction';
import { FinanceService } from '../../services/finance.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { ThemeService } from '../../services/theme.service';
import { TransactionsComponent } from '../transactions/transactions'; // Importar
import { getDatePart, isSameOrBeforeDay } from '../../utils/date.util';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionsComponent], // Adicionar TransactionsComponent
  templateUrl: './reports.html',
  styleUrls: ['./reports.css'],
})
export class ReportsComponent implements OnInit, OnDestroy, AfterViewInit {
  // Referência para o <canvas> no HTML
  @ViewChild('balanceChart') private balanceChartRef!: ElementRef;

  allTransactions: Transaction[] = [];
  transactionHistory: Transaction[] = []; // Lista apenas com transações passadas
  paginatedTransactions: Transaction[] = [];
  nextMonthExpenses: Transaction[] = [];
  nextMonthTotal = 0;
  isBalanceVisible = true;

  itemsPerPage = 5;
  itemsPerPageOptions = [5, 10, 20, 50];
  currentPage = 1;
  totalPages = 1;

  // Gráfico de evolução do saldo
  balanceChart: Chart | undefined;
  selectedPeriod = 12;
  periodOptions = [
    { label: '6M', value: 6 },
    { label: '1 ano', value: 12 },
    { label: '2 anos', value: 24 },
  ];

  // Para controlar o modal de edição
  isModalOpen = false;

  constructor(
    private financeService: FinanceService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private themeService: ThemeService
  ) {
    // Redesenha o gráfico com as cores certas quando o tema muda em tempo real.
    effect(() => {
      this.themeService.theme();
      if (this.balanceChart) {
        this.createBalanceChart();
      }
    });
  }

  ngOnInit(): void {
    this.loadReportData();
  }

  ngAfterViewInit(): void {
    // A criação do gráfico deve ocorrer depois da view ser inicializada
    this.createBalanceChart();
  }

  ngOnDestroy(): void {
    this.balanceChart?.destroy();
  }

  loadReportData(): void {
    this.allTransactions = this.financeService.generateEffectiveTransactions();
    const today = new Date();

    this.transactionHistory = this.allTransactions.filter((t) => {
      const isPastOrPresent = isSameOrBeforeDay(t.date, today);
      const isFutureExpense = t.type === 'expense' && !isPastOrPresent;
      return isPastOrPresent || isFutureExpense;
    });

    this.calculateProjections();
    this.updatePagination();

    if (this.balanceChart) {
      this.createBalanceChart();
    }
  }

  onPeriodChange(months: number): void {
    this.selectedPeriod = months;
    this.createBalanceChart();
  }

  createBalanceChart(): void {
    this.balanceChart?.destroy();

    const history = this.financeService.getBalanceHistory(this.selectedPeriod);

    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue('--primary').trim() || '#6366F1';
    const mutedForeground =
      styles.getPropertyValue('--muted-foreground').trim() || '#64748B';
    const border = styles.getPropertyValue('--border').trim() || '#E8ECF1';

    this.balanceChart = new Chart(this.balanceChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: history.map((p) => p.label),
        datasets: [
          {
            label: 'Saldo Acumulado',
            data: history.map((p) => p.balance),
            borderColor: primary,
            backgroundColor: primary + '1A',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: primary,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: mutedForeground },
            grid: { color: border },
          },
          y: {
            ticks: {
              color: mutedForeground,
              callback: (value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                }).format(Number(value)),
            },
            grid: { color: border },
          },
        },
      },
    });
  }

  calculateProjections(): void {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    this.nextMonthExpenses = this.allTransactions.filter((t) => {
      const { year, month } = getDatePart(t.date);
      return (
        t.type === 'expense' &&
        month === nextMonth.getMonth() &&
        year === nextMonth.getFullYear()
      );
    });

    this.nextMonthTotal = this.nextMonthExpenses.reduce(
      (sum, t) => sum + t.value,
      0
    );
  }

  updatePagination(): void {
    // A paginação agora usa a lista de histórico filtrada
    this.totalPages = Math.ceil(
      this.transactionHistory.length / this.itemsPerPage
    );
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTransactions = this.transactionHistory.slice(
      startIndex,
      endIndex
    );
  }

  // --- Funções para Ações e Modal ---

  openModal(transaction: Transaction): void {
    // Para edição, precisamos passar o ID da REGRA para o componente de transação
    // Esta é uma maneira de fazer isso, mas o ideal seria um serviço de estado
    this.transactionService.startEdit(transaction.sourceRuleId!);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.transactionService.clearEdit(); // Limpa o estado de edição
    this.loadReportData(); // Recarrega os dados após salvar
  }

  onDelete(ruleId: string): void {
    if (confirm('Tem certeza de que deseja excluir esta regra de transação?')) {
      this.transactionService.deleteRecurrenceRule(ruleId);
      this.notificationService.show(
        'Regra de recorrência excluída!',
        'success'
      );
      this.loadReportData();
    }
  }

  // Funções de controle da UI que faltavam
  toggleBalanceVisibility = () =>
    (this.isBalanceVisible = !this.isBalanceVisible);
  previousPage = () => {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  };
  nextPage = () => {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  };
  onItemsPerPageChange = (event: Event) => {
    this.itemsPerPage = Number((event.target as HTMLSelectElement).value);
    this.updatePagination();
  };
}
