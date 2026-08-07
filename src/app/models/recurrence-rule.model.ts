// ARQUIVO: src/app/models/recurrence-rule.model.ts

export interface RecurrenceRule {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  description: string;
  value: number;
  startDate: string; // Data de início (YYYY-MM-DD)
  dayOfMonth: number; // Dia do mês para a recorrência

  // Se for nulo ou 0, a recorrência é infinita.
  // Se for > 0, representa o número de parcelas.
  installments?: number | null;

  isActive: boolean;

  categoryId?: string | null;
}
