// ARQUIVO: src/app/services/budget.service.ts

import { Injectable } from '@angular/core';
import { Budget } from '../models/budget';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private budgetsKey = 'budgets';

  constructor(private authService: AuthService) {}

  getBudgets(): Budget[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    return this.getAllFromStorage().filter((b) => b.userId === currentUser.id);
  }

  setBudget(categoryId: string, monthlyLimit: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const all = this.getAllFromStorage();
    const existing = all.find(
      (b) => b.userId === currentUser.id && b.categoryId === categoryId
    );

    if (existing) {
      existing.monthlyLimit = monthlyLimit;
    } else {
      all.push({
        id: `budget_${new Date().getTime()}`,
        userId: currentUser.id,
        categoryId,
        monthlyLimit,
      });
    }
    this.saveAllToStorage(all);
  }

  deleteBudget(categoryId: string): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const all = this.getAllFromStorage();
    this.saveAllToStorage(
      all.filter((b) => !(b.userId === currentUser.id && b.categoryId === categoryId))
    );
  }

  private getAllFromStorage(): Budget[] {
    const data = localStorage.getItem(this.budgetsKey);
    return data ? JSON.parse(data) : [];
  }

  private saveAllToStorage(budgets: Budget[]): void {
    localStorage.setItem(this.budgetsKey, JSON.stringify(budgets));
  }
}
