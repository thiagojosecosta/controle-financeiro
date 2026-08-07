// ARQUIVO: src/app/services/finance.service.ts

import { Injectable } from '@angular/core';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import { BudgetService } from './budget.service';
import { Transaction } from '../models/transaction';
import { getDatePart, isSameOrBeforeDay } from '../utils/date.util';

export interface BalancePoint {
  label: string;
  balance: number;
}

export interface CategorySpending {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  spent: number;
  budgetLimit: number | null;
  percentUsed: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private budgetService: BudgetService
  ) {}

  // MÉTODO PRINCIPAL DE PROJEÇÃO (CORRIGIDO)
  public generateEffectiveTransactions(): Transaction[] {
    const baseTransactions = this.transactionService.getTransactions();
    const rules = this.transactionService.getRecurrenceRules();
    const projectedTransactions: Transaction[] = [];

    const today = new Date();
    const lookbackYears = 5;
    const lookaheadYears = 5;

    rules.forEach((rule) => {
      const startDate = new Date(rule.startDate + 'T00:00:00Z');
      let occurrenceCount = 0;

      for (let y = -lookbackYears; y <= lookaheadYears; y++) {
        for (let m = 0; m < 12; m++) {
          const firstDayOfMonth = new Date(
            Date.UTC(today.getFullYear() + y, m, 1)
          );
          const daysInMonth = new Date(
            firstDayOfMonth.getFullYear(),
            firstDayOfMonth.getMonth() + 1,
            0
          ).getDate();
          const day = Math.min(rule.dayOfMonth, daysInMonth);

          let occurrenceDate = new Date(
            Date.UTC(
              firstDayOfMonth.getFullYear(),
              firstDayOfMonth.getMonth(),
              day
            )
          );

          if (occurrenceDate < startDate) continue;

          if (rule.installments && rule.installments > 0) {
            const monthsDiff =
              (occurrenceDate.getFullYear() - startDate.getFullYear()) * 12 +
              (occurrenceDate.getMonth() - startDate.getMonth());
            if (monthsDiff >= rule.installments) continue;
            occurrenceCount = monthsDiff + 1;
          }

          const description =
            rule.installments && rule.installments > 0
              ? `${rule.description} (${occurrenceCount}/${rule.installments})`
              : rule.description;

          projectedTransactions.push({
            id: `rule-${rule.id}-${occurrenceDate.toISOString().split('T')[0]}`,
            userId: rule.userId,
            description: description,
            value: rule.value,
            date: occurrenceDate.toISOString(),
            type: rule.type,
            isRecurring: true,
            sourceRuleId: rule.id,
            categoryId: rule.categoryId ?? null,
          });
        }
      }
    });

    const allTransactions = [...baseTransactions, ...projectedTransactions];
    return allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // MÉTODO ADICIONADO DE VOLTA
  public getMonthlySummary(month?: Date) {
    const targetMonth = month ? month.getMonth() : new Date().getMonth();
    const targetYear = month ? month.getFullYear() : new Date().getFullYear();

    const transactions = this.generateEffectiveTransactions().filter((t) => {
      const { year, month } = getDatePart(t.date);
      return month === targetMonth && year === targetYear;
    });

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.value, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.value, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  // Gastos do mês agrupados por categoria, com progresso de orçamento quando existir.
  public getCategorySpendingSummary(month?: Date): CategorySpending[] {
    const targetMonth = month ? month.getMonth() : new Date().getMonth();
    const targetYear = month ? month.getFullYear() : new Date().getFullYear();

    const expenses = this.generateEffectiveTransactions().filter((t) => {
      const { year, month: m } = getDatePart(t.date);
      return t.type === 'expense' && m === targetMonth && year === targetYear;
    });

    const categories = this.categoryService.getCategories();
    const budgets = this.budgetService.getBudgets();

    const spentByCategory = new Map<string, number>();
    for (const t of expenses) {
      const key = t.categoryId ?? '__none__';
      spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + t.value);
    }

    const summary: CategorySpending[] = [];
    for (const [key, spent] of spentByCategory) {
      if (key === '__none__') {
        summary.push({
          categoryId: null,
          name: 'Sem categoria',
          icon: 'fa-ellipsis',
          color: '#64748B',
          spent,
          budgetLimit: null,
          percentUsed: null,
        });
        continue;
      }
      const category = categories.find((c) => c.id === key);
      const budget = budgets.find((b) => b.categoryId === key);
      summary.push({
        categoryId: key,
        name: category?.name ?? 'Sem categoria',
        icon: category?.icon ?? 'fa-ellipsis',
        color: category?.color ?? '#64748B',
        spent,
        budgetLimit: budget?.monthlyLimit ?? null,
        percentUsed: budget ? (spent / budget.monthlyLimit) * 100 : null,
      });
    }

    return summary.sort((a, b) => b.spent - a.spent);
  }

  // Saldo acumulado (receitas - despesas) até o fim de cada um dos últimos
  // N meses — serve como proxy de "patrimônio líquido" já que este app não
  // tem conceito de ativos separado.
  public getBalanceHistory(monthsBack: number): BalancePoint[] {
    const all = this.generateEffectiveTransactions();
    const today = new Date();
    const points: BalancePoint[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endOfMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );
      const balance = all
        .filter((t) => isSameOrBeforeDay(t.date, endOfMonth))
        .reduce((sum, t) => sum + (t.type === 'income' ? t.value : -t.value), 0);

      const label = monthDate
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        .replace('.', '');

      points.push({ label, balance });
    }

    return points;
  }
}
