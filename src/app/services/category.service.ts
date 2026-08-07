// ARQUIVO: src/app/services/category.service.ts

import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { AuthService } from './auth.service';
import {
  CategoryGroupService,
  DEFAULT_GROUP_NAMES,
} from './category-group.service';

const DEFAULT_CATEGORIES: (Omit<Category, 'id' | 'userId' | 'groupId'> & {
  groupName: string | null;
})[] = [
  { name: 'Salário', icon: 'fa-money-bill-wave', color: '#059669', type: 'income', groupName: null },
  { name: 'Alimentação', icon: 'fa-utensils', color: '#F59E0B', type: 'expense', groupName: DEFAULT_GROUP_NAMES.essenciais },
  { name: 'Transporte', icon: 'fa-car', color: '#3B82F6', type: 'expense', groupName: DEFAULT_GROUP_NAMES.essenciais },
  { name: 'Moradia', icon: 'fa-house', color: '#8B5CF6', type: 'expense', groupName: DEFAULT_GROUP_NAMES.essenciais },
  { name: 'Saúde', icon: 'fa-heart-pulse', color: '#EC4899', type: 'expense', groupName: DEFAULT_GROUP_NAMES.essenciais },
  { name: 'Lazer', icon: 'fa-gamepad', color: '#06B6D4', type: 'expense', groupName: DEFAULT_GROUP_NAMES.estiloDeVida },
  { name: 'Compras', icon: 'fa-bag-shopping', color: '#F97316', type: 'expense', groupName: DEFAULT_GROUP_NAMES.estiloDeVida },
  { name: 'Outros', icon: 'fa-ellipsis', color: '#64748B', type: 'expense', groupName: DEFAULT_GROUP_NAMES.outros },
];

// Paleta e ícones oferecidos ao usuário ao criar uma categoria nova.
export const CATEGORY_COLOR_OPTIONS = [
  '#059669', '#F59E0B', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#64748B',
];

export const CATEGORY_ICON_OPTIONS = [
  'fa-utensils', 'fa-car', 'fa-house', 'fa-heart-pulse',
  'fa-gamepad', 'fa-bag-shopping', 'fa-money-bill-wave', 'fa-graduation-cap',
  'fa-plane', 'fa-ellipsis',
];

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesKey = 'categories';

  constructor(
    private authService: AuthService,
    private categoryGroupService: CategoryGroupService
  ) {}

  getCategories(): Category[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];

    const all = this.getAllFromStorage();
    let mine = all.filter((c) => c.userId === currentUser.id);

    if (mine.length === 0) {
      const groups = this.categoryGroupService.getGroups();
      const groupIdByName = new Map(groups.map((g) => [g.name, g.id]));

      mine = DEFAULT_CATEGORIES.map((c) => {
        const { groupName, ...rest } = c;
        return {
          ...rest,
          id: `cat_${currentUser.id}_${c.name}`,
          userId: currentUser.id,
          groupId: groupName ? groupIdByName.get(groupName) ?? null : null,
        };
      });
      this.saveAllToStorage([...all, ...mine]);
    }

    return mine;
  }

  addCategory(category: Omit<Category, 'id' | 'userId'>): Category {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const newCategory: Category = {
      ...category,
      id: `cat_${new Date().getTime()}`,
      userId: currentUser.id,
    };
    const all = this.getAllFromStorage();
    all.push(newCategory);
    this.saveAllToStorage(all);
    return newCategory;
  }

  updateCategory(category: Category): void {
    const all = this.getAllFromStorage();
    const index = all.findIndex((c) => c.id === category.id);
    if (index === -1) return;
    all[index] = category;
    this.saveAllToStorage(all);
  }

  deleteCategory(categoryId: string): void {
    const all = this.getAllFromStorage();
    this.saveAllToStorage(all.filter((c) => c.id !== categoryId));
  }

  private getAllFromStorage(): Category[] {
    const data = localStorage.getItem(this.categoriesKey);
    return data ? JSON.parse(data) : [];
  }

  private saveAllToStorage(categories: Category[]): void {
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
  }
}
