// ARQUIVO: src/app/services/finance.service.ts

import { Injectable } from '@angular/core';
import { TransactionService } from './transaction.service';
import { Transaction } from '../models/transaction';
import { getDatePart } from '../utils/date.util';

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  constructor(private transactionService: TransactionService) {}

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

  // MÉTODO ADICIONADO DE VOLTA
  public groupTransactionsByCategory(
    transactions: Transaction[],
    type: 'income' | 'expense'
  ) {
    const filtered = transactions.filter((t) => t.type === type);
    const grouped = filtered.reduce((acc, t) => {
      // Usaremos a descrição como categoria por agora
      const category = t.description.replace(/\s\(\d+\/\d+\)$/, ''); // Remove (1/12)
      acc[category] = (acc[category] || 0) + t.value;
      return acc;
    }, {} as { [key: string]: number });

    return {
      labels: Object.keys(grouped),
      data: Object.values(grouped),
    };
  }
}
