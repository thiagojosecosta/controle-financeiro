// ARQUIVO: src/app/models/goal.ts

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null; // 'YYYY-MM-DD'
  icon: string;
  color: string;
  status: GoalStatus;
}
