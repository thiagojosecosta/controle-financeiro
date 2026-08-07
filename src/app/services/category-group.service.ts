// ARQUIVO: src/app/services/category-group.service.ts

import { Injectable } from '@angular/core';
import { CategoryGroup } from '../models/category-group';
import { AuthService } from './auth.service';

export const DEFAULT_GROUP_NAMES = {
  essenciais: 'Essenciais',
  estiloDeVida: 'Estilo de Vida',
  outros: 'Outros',
};

export const DEFAULT_GROUPS: Omit<CategoryGroup, 'id' | 'userId'>[] = [
  { name: DEFAULT_GROUP_NAMES.essenciais, icon: 'fa-house-chimney', color: '#3B82F6' },
  { name: DEFAULT_GROUP_NAMES.estiloDeVida, icon: 'fa-mask', color: '#EC4899' },
  { name: DEFAULT_GROUP_NAMES.outros, icon: 'fa-ellipsis', color: '#64748B' },
];

export const GROUP_COLOR_OPTIONS = [
  '#059669', '#F59E0B', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#64748B',
];

export const GROUP_ICON_OPTIONS = [
  'fa-house-chimney', 'fa-mask', 'fa-briefcase', 'fa-graduation-cap',
  'fa-heart-pulse', 'fa-piggy-bank', 'fa-cart-shopping', 'fa-ellipsis',
];

@Injectable({
  providedIn: 'root',
})
export class CategoryGroupService {
  private groupsKey = 'category_groups';

  constructor(private authService: AuthService) {}

  getGroups(): CategoryGroup[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];

    const all = this.getAllFromStorage();
    let mine = all.filter((g) => g.userId === currentUser.id);

    if (mine.length === 0) {
      mine = DEFAULT_GROUPS.map((g) => ({
        ...g,
        id: `catgrp_${currentUser.id}_${g.name}`,
        userId: currentUser.id,
      }));
      this.saveAllToStorage([...all, ...mine]);
    }

    return mine;
  }

  addGroup(group: Omit<CategoryGroup, 'id' | 'userId'>): CategoryGroup {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) throw new Error('Usuário não autenticado.');

    const newGroup: CategoryGroup = {
      ...group,
      id: `catgrp_${new Date().getTime()}`,
      userId: currentUser.id,
    };
    const all = this.getAllFromStorage();
    all.push(newGroup);
    this.saveAllToStorage(all);
    return newGroup;
  }

  updateGroup(group: CategoryGroup): void {
    const all = this.getAllFromStorage();
    const index = all.findIndex((g) => g.id === group.id);
    if (index === -1) return;
    all[index] = group;
    this.saveAllToStorage(all);
  }

  deleteGroup(groupId: string): void {
    const all = this.getAllFromStorage();
    this.saveAllToStorage(all.filter((g) => g.id !== groupId));
  }

  private getAllFromStorage(): CategoryGroup[] {
    const data = localStorage.getItem(this.groupsKey);
    return data ? JSON.parse(data) : [];
  }

  private saveAllToStorage(groups: CategoryGroup[]): void {
    localStorage.setItem(this.groupsKey, JSON.stringify(groups));
  }
}
