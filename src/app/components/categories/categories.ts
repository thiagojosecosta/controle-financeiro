// ARQUIVO: src/app/components/categories/categories.ts

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
  CategoryService,
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
} from '../../services/category.service';
import {
  CategoryGroupService,
  GROUP_COLOR_OPTIONS,
  GROUP_ICON_OPTIONS,
} from '../../services/category-group.service';
import { BudgetService } from '../../services/budget.service';
import { Category } from '../../models/category';
import { CategoryGroup } from '../../models/category-group';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './categories.html',
  styleUrls: ['./categories.css'],
})
export class CategoriesComponent implements OnInit {
  categoryForm: FormGroup;
  groupForm: FormGroup;

  categories: Category[] = [];
  groups: CategoryGroup[] = [];

  colorOptions = CATEGORY_COLOR_OPTIONS;
  iconOptions = CATEGORY_ICON_OPTIONS;
  groupColorOptions = GROUP_COLOR_OPTIONS;
  groupIconOptions = GROUP_ICON_OPTIONS;

  budgetAmounts: { [categoryId: string]: number | null } = {};

  editingCategoryId: string | null = null;
  editingGroupId: string | null = null;

  isCategoryFormOpen = false;
  isGroupFormOpen = false;

  collapsedGroups = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private categoryService: CategoryService,
    private categoryGroupService: CategoryGroupService,
    private budgetService: BudgetService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      type: ['expense', Validators.required],
      color: [CATEGORY_COLOR_OPTIONS[0], Validators.required],
      icon: [CATEGORY_ICON_OPTIONS[0], Validators.required],
      groupId: [null],
    });
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      color: [GROUP_COLOR_OPTIONS[0], Validators.required],
      icon: [GROUP_ICON_OPTIONS[0], Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadGroups();
    this.loadCategories();
  }

  get expenseCategories(): Category[] {
    return this.categories.filter((c) => c.type === 'expense');
  }

  get ungroupedCategories(): Category[] {
    return this.categories.filter((c) => !c.groupId);
  }

  categoriesForGroup(groupId: string): Category[] {
    return this.categories.filter((c) => c.groupId === groupId);
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups.has(groupId);
  }

  toggleGroupCollapsed(groupId: string): void {
    if (this.collapsedGroups.has(groupId)) {
      this.collapsedGroups.delete(groupId);
    } else {
      this.collapsedGroups.add(groupId);
    }
  }

  loadGroups(): void {
    this.groups = this.categoryGroupService.getGroups();
  }

  loadCategories(): void {
    this.categories = this.categoryService.getCategories();
    const budgets = this.budgetService.getBudgets();
    this.budgetAmounts = {};
    for (const cat of this.categories) {
      const budget = budgets.find((b) => b.categoryId === cat.id);
      this.budgetAmounts[cat.id] = budget?.monthlyLimit ?? null;
    }
  }

  // --- Categorias ---

  openNewCategoryForm(): void {
    this.editingCategoryId = null;
    this.categoryForm.reset({
      name: '',
      type: 'expense',
      color: CATEGORY_COLOR_OPTIONS[0],
      icon: CATEGORY_ICON_OPTIONS[0],
      groupId: null,
    });
    this.isCategoryFormOpen = true;
  }

  startEdit(cat: Category): void {
    this.editingCategoryId = cat.id;
    this.categoryForm.setValue({
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      groupId: cat.groupId ?? null,
    });
    this.isCategoryFormOpen = true;
  }

  cancelEdit(): void {
    this.editingCategoryId = null;
    this.isCategoryFormOpen = false;
    this.categoryForm.reset({
      name: '',
      type: 'expense',
      color: CATEGORY_COLOR_OPTIONS[0],
      icon: CATEGORY_ICON_OPTIONS[0],
      groupId: null,
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;
    const { name, type, color, icon, groupId } = this.categoryForm.value;

    if (this.editingCategoryId) {
      const existing = this.categories.find(
        (c) => c.id === this.editingCategoryId
      );
      if (existing) {
        this.categoryService.updateCategory({
          ...existing,
          name,
          type,
          color,
          icon,
          groupId: groupId || null,
        });
        this.notificationService.show('Categoria atualizada!', 'success');
      }
    } else {
      this.categoryService.addCategory({
        name,
        type,
        color,
        icon,
        groupId: groupId || null,
      });
      this.notificationService.show('Categoria criada com sucesso!', 'success');
    }

    this.cancelEdit();
    this.loadCategories();
  }

  deleteCategory(categoryId: string): void {
    if (!confirm('Excluir esta categoria? Transações já lançadas não são afetadas.'))
      return;
    this.categoryService.deleteCategory(categoryId);
    this.budgetService.deleteBudget(categoryId);
    if (this.editingCategoryId === categoryId) this.cancelEdit();
    this.loadCategories();
    this.notificationService.show('Categoria excluída.', 'success');
  }

  saveBudget(categoryId: string): void {
    const value = this.budgetAmounts[categoryId];
    if (value === null || value === undefined || value <= 0) {
      this.budgetService.deleteBudget(categoryId);
      return;
    }
    this.budgetService.setBudget(categoryId, value);
    this.notificationService.show('Orçamento salvo.', 'success');
  }

  // --- Grupos ---

  openNewGroupForm(): void {
    this.editingGroupId = null;
    this.groupForm.reset({
      name: '',
      color: GROUP_COLOR_OPTIONS[0],
      icon: GROUP_ICON_OPTIONS[0],
    });
    this.isGroupFormOpen = true;
  }

  startEditGroup(group: CategoryGroup): void {
    this.editingGroupId = group.id;
    this.groupForm.setValue({
      name: group.name,
      color: group.color,
      icon: group.icon,
    });
    this.isGroupFormOpen = true;
  }

  cancelEditGroup(): void {
    this.editingGroupId = null;
    this.isGroupFormOpen = false;
    this.groupForm.reset({
      name: '',
      color: GROUP_COLOR_OPTIONS[0],
      icon: GROUP_ICON_OPTIONS[0],
    });
  }

  saveGroup(): void {
    if (this.groupForm.invalid) return;
    const { name, color, icon } = this.groupForm.value;

    if (this.editingGroupId) {
      const existing = this.groups.find((g) => g.id === this.editingGroupId);
      if (existing) {
        this.categoryGroupService.updateGroup({ ...existing, name, color, icon });
        this.notificationService.show('Grupo atualizado!', 'success');
      }
    } else {
      this.categoryGroupService.addGroup({ name, color, icon });
      this.notificationService.show('Grupo criado com sucesso!', 'success');
    }

    this.cancelEditGroup();
    this.loadGroups();
  }

  deleteGroup(groupId: string): void {
    if (
      !confirm(
        'Excluir este grupo? As categorias dele não serão apagadas, apenas ficarão sem grupo.'
      )
    )
      return;

    for (const cat of this.categoriesForGroup(groupId)) {
      this.categoryService.updateCategory({ ...cat, groupId: null });
    }
    this.categoryGroupService.deleteGroup(groupId);

    if (this.editingGroupId === groupId) this.cancelEditGroup();
    this.loadGroups();
    this.loadCategories();
    this.notificationService.show('Grupo excluído.', 'success');
  }
}
