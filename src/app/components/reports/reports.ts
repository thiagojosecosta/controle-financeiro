// ARQUIVO: src/app/components/reports/reports.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Transaction } from '../../models/transaction';
import { FinanceService } from '../../services/finance.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
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
  // Referências para os <canvas> no HTML
  @ViewChild('incomeExpenseChart') private incomeExpenseChartRef!: ElementRef;
  @ViewChild('nextMonthChart') private nextMonthChartRef!: ElementRef;

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

  // Variáveis para os gráficos
  incomeExpenseChart: Chart | undefined;
  nextMonthChart: Chart | undefined;

  // Para controlar o modal de edição
  isModalOpen = false;

  constructor(
    private financeService: FinanceService,
    private transactionService: TransactionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  ngAfterViewInit(): void {
    // A criação dos gráficos deve ocorrer depois da view ser inicializada
    this.createCharts();
  }

  ngOnDestroy(): void {
    this.incomeExpenseChart?.destroy();
    this.nextMonthChart?.destroy();
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

    if (this.incomeExpenseChart || this.nextMonthChart) {
      this.createCharts();
    }
  }

  createCharts(): void {
    this.destroyCharts(); // Garante que gráficos antigos sejam destruídos

    const today = new Date();
    const summaryCurrentMonth = this.financeService.getMonthlySummary(today);
    this.incomeExpenseChart = new Chart(
      this.incomeExpenseChartRef.nativeElement,
      {
        type: 'doughnut',
        data: {
          labels: ['Receitas', 'Despesas'],
          datasets: [
            {
              data: [summaryCurrentMonth.income, summaryCurrentMonth.expense],
              backgroundColor: ['#2ecc71', '#e74c3c'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
        },
      }
    );

    // Gráfico 2: Despesas Previstas para o Próximo Mês
    const nextMonthDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const summaryNextMonth =
      this.financeService.getMonthlySummary(nextMonthDate);

    this.nextMonthChart = new Chart(this.nextMonthChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Receitas Previstas', 'Despesas Previstas'],
        datasets: [
          {
            data: [summaryNextMonth.income, summaryNextMonth.expense],
            backgroundColor: ['#2ecc71', '#e74c3c'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
      },
    });
  }

  private destroyCharts(): void {
    this.incomeExpenseChart?.destroy();
    this.nextMonthChart?.destroy();
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
