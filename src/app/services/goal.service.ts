// ARQUIVO: src/app/services/goal.service.ts

import { Injectable } from '@angular/core';
import { Goal } from '../models/goal';
import { AuthService } from './auth.service';

export const GOAL_COLOR_OPTIONS = [
  '#059669', '#F59E0B', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#64748B',
];

export const GOAL_ICON_OPTIONS = [
  'fa-piggy-bank', 'fa-plane', 'fa-house', 'fa-car',
  'fa-graduation-cap', 'fa-ring', 'fa-umbrella-beach', 'fa-laptop',
  'fa-gift', 'fa-shield-heart',
];

@Injectable({
  providedIn: 'root',
})
export class GoalService {
  private goalsKey = 'goals';

  constructor(private authService: AuthService) {}

  getGoals(): Goal[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];
    const all = this.getAllFromStorage();
    return all.filter((g) => g.userId === currentUser.id);
  }

  addGoal(goal: Omit<Goal, 'id' | 'userId' | 'status'>): Goal {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const newGoal: Goal = {
      ...goal,
      id: `goal_${new Date().getTime()}`,
      userId: currentUser.id,
      status:
        goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0
          ? 'completed'
          : 'active',
    };
    const all = this.getAllFromStorage();
    all.push(newGoal);
    this.saveAllToStorage(all);
    return newGoal;
  }

  updateGoal(goal: Goal): void {
    const all = this.getAllFromStorage();
    const index = all.findIndex((g) => g.id === goal.id);
    if (index === -1) return;
    all[index] = goal;
    this.saveAllToStorage(all);
  }

  deleteGoal(goalId: string): void {
    const all = this.getAllFromStorage();
    this.saveAllToStorage(all.filter((g) => g.id !== goalId));
  }

  updateProgress(goalId: string, newAmount: number): void {
    const all = this.getAllFromStorage();
    const index = all.findIndex((g) => g.id === goalId);
    if (index === -1) return;

    const goal = all[index];
    goal.currentAmount = newAmount;
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'active') {
      goal.status = 'completed';
    } else if (goal.currentAmount < goal.targetAmount && goal.status === 'completed') {
      goal.status = 'active';
    }
    this.saveAllToStorage(all);
  }

  setStatus(goalId: string, status: Goal['status']): void {
    const all = this.getAllFromStorage();
    const index = all.findIndex((g) => g.id === goalId);
    if (index === -1) return;
    all[index].status = status;
    this.saveAllToStorage(all);
  }

  private getAllFromStorage(): Goal[] {
    const data = localStorage.getItem(this.goalsKey);
    return data ? JSON.parse(data) : [];
  }

  private saveAllToStorage(goals: Goal[]): void {
    localStorage.setItem(this.goalsKey, JSON.stringify(goals));
  }
}
