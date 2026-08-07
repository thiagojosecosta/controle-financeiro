// ARQUIVO: src/app/components/goals/goals.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import {
  GoalService,
  GOAL_COLOR_OPTIONS,
  GOAL_ICON_OPTIONS,
} from '../../services/goal.service';
import { Goal, GoalStatus } from '../../models/goal';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';
import { DatePickerComponent } from '../date-picker/date-picker';
import { getDatePart } from '../../utils/date.util';

type TabStatus = GoalStatus | 'all';

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'active', label: 'Ativas' },
  { key: 'completed', label: 'Concluídas' },
  { key: 'paused', label: 'Em pausa' },
  { key: 'archived', label: 'Arquivadas' },
  { key: 'all', label: 'Todas' },
];

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CurrencyMaskDirective,
    DatePickerComponent,
  ],
  templateUrl: './goals.html',
  styleUrls: ['./goals.css'],
})
export class GoalsComponent implements OnInit {
  goalForm: FormGroup;

  goals: Goal[] = [];
  colorOptions = GOAL_COLOR_OPTIONS;
  iconOptions = GOAL_ICON_OPTIONS;
  tabs = TABS;
  activeTab: TabStatus = 'active';

  editingGoalId: string | null = null;
  isFormOpen = false;

  progressAmounts: { [goalId: string]: number | null } = {};
  editingProgressId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private goalService: GoalService
  ) {
    this.goalForm = this.fb.group({
      name: ['', Validators.required],
      targetAmount: [null, [Validators.required, Validators.min(0.01)]],
      currentAmount: [0, [Validators.required, Validators.min(0)]],
      targetDate: [null],
      color: [GOAL_COLOR_OPTIONS[0], Validators.required],
      icon: [GOAL_ICON_OPTIONS[0], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadGoals();
  }

  get filteredGoals(): Goal[] {
    if (this.activeTab === 'all') return this.goals;
    return this.goals.filter((g) => g.status === this.activeTab);
  }

  countForTab(tab: TabStatus): number {
    if (tab === 'all') return this.goals.length;
    return this.goals.filter((g) => g.status === tab).length;
  }

  loadGoals(): void {
    this.goals = this.goalService.getGoals();
  }

  progressPercent(goal: Goal): number {
    if (goal.targetAmount <= 0) return 0;
    const pct = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, pct));
  }

  progressLabel(goal: Goal): string {
    if (goal.targetAmount <= 0) return '0%';
    const pct = (goal.currentAmount / goal.targetAmount) * 100;
    return `${Math.round(pct)}%`;
  }

  formatTargetDate(goal: Goal): string | null {
    if (!goal.targetDate) return null;
    const { year, month, day } = getDatePart(goal.targetDate);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(day)}/${pad(month + 1)}/${year}`;
  }

  // --- Formulário ---

  openNewGoalForm(): void {
    this.editingGoalId = null;
    this.goalForm.reset({
      name: '',
      targetAmount: null,
      currentAmount: 0,
      targetDate: null,
      color: GOAL_COLOR_OPTIONS[0],
      icon: GOAL_ICON_OPTIONS[0],
    });
    this.isFormOpen = true;
  }

  startEdit(goal: Goal): void {
    this.editingGoalId = goal.id;
    this.goalForm.setValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      color: goal.color,
      icon: goal.icon,
    });
    this.isFormOpen = true;
  }

  cancelEdit(): void {
    this.editingGoalId = null;
    this.isFormOpen = false;
    this.goalForm.reset({
      name: '',
      targetAmount: null,
      currentAmount: 0,
      targetDate: null,
      color: GOAL_COLOR_OPTIONS[0],
      icon: GOAL_ICON_OPTIONS[0],
    });
  }

  saveGoal(): void {
    if (this.goalForm.invalid) return;
    const { name, targetAmount, currentAmount, targetDate, color, icon } =
      this.goalForm.value;

    if (this.editingGoalId) {
      const existing = this.goals.find((g) => g.id === this.editingGoalId);
      if (existing) {
        const updated: Goal = {
          ...existing,
          name,
          targetAmount,
          currentAmount,
          targetDate,
          color,
          icon,
        };
        if (updated.currentAmount >= updated.targetAmount && updated.status === 'active') {
          updated.status = 'completed';
        } else if (
          updated.currentAmount < updated.targetAmount &&
          updated.status === 'completed'
        ) {
          updated.status = 'active';
        }
        this.goalService.updateGoal(updated);
        this.notificationService.show('Meta atualizada!', 'success');
      }
    } else {
      this.goalService.addGoal({
        name,
        targetAmount,
        currentAmount: currentAmount || 0,
        targetDate,
        color,
        icon,
      });
      this.notificationService.show('Meta criada com sucesso!', 'success');
    }

    this.cancelEdit();
    this.loadGoals();
  }

  deleteGoal(goalId: string): void {
    if (!confirm('Excluir esta meta? Essa ação não pode ser desfeita.')) return;
    this.goalService.deleteGoal(goalId);
    if (this.editingGoalId === goalId) this.cancelEdit();
    this.loadGoals();
    this.notificationService.show('Meta excluída.', 'success');
  }

  // --- Progresso rápido ---

  startEditProgress(goal: Goal): void {
    this.editingProgressId = goal.id;
    this.progressAmounts[goal.id] = goal.currentAmount;
  }

  cancelEditProgress(): void {
    this.editingProgressId = null;
  }

  saveProgress(goalId: string): void {
    const value = this.progressAmounts[goalId];
    if (value === null || value === undefined || value < 0) return;
    this.goalService.updateProgress(goalId, value);
    this.editingProgressId = null;
    this.loadGoals();
    this.notificationService.show('Progresso atualizado!', 'success');
  }

  // --- Status ---

  pauseGoal(goal: Goal): void {
    this.goalService.setStatus(goal.id, 'paused');
    this.loadGoals();
  }

  resumeGoal(goal: Goal): void {
    this.goalService.setStatus(
      goal.id,
      goal.currentAmount >= goal.targetAmount ? 'completed' : 'active'
    );
    this.loadGoals();
  }

  archiveGoal(goal: Goal): void {
    this.goalService.setStatus(goal.id, 'archived');
    this.loadGoals();
  }
}
