// ARQUIVO: src/app/models/transaction.model.ts

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  value: number;
  date: string; // Formato ISO 8601
  type: 'income' | 'expense';
  isRecurring?: boolean;

  // PROPRIEDADE ADICIONADA: Opcional, para sabermos a origem da transação
  sourceRuleId?: string;

  categoryId?: string | null;
}
