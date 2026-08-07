// ARQUIVO: src/app/models/budget.ts

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
}
