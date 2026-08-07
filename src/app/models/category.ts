// ARQUIVO: src/app/models/category.ts

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string; // classe do Font Awesome, ex: 'fa-utensils'
  color: string; // hex
  type: 'income' | 'expense';
  groupId?: string | null;
}
