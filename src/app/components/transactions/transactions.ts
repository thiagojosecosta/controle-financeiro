// ARQUIVO: src/app/components/transactions/transactions.ts

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Transaction } from '../../models/transaction';
import { RecurrenceRule } from '../../models/recurrence-rule.model';
import { FinanceService } from '../../services/finance.service';
import { AuthService } from '../../services/auth.service';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';
import { CurrencyMaskDirective } from '../../directives/currency-mask.directive';
import { getDatePart } from '../../utils/date.util';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category';
import { DatePickerComponent } from '../date-picker/date-picker';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyMaskDirective,
    DatePickerComponent,
  ],
  templateUrl: './transactions.html',
  styleUrls: ['./transactions.css'],
})
export class TransactionsComponent implements OnInit {
  // O resto da sua classe continua exatamente igual.
  // Colei a classe completa abaixo para garantir que não haja outros erros.

  transactionForm!: FormGroup;
  isModalOpen = false;
  editingRuleId: string | null = null;
  allTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isBalanceVisible = true;

  // Quando usado embutido dentro de um popup (Dashboard/Relatórios), abre o
  // formulário de transação imediatamente em vez de mostrar a lista por baixo.
  @Input() autoOpen = false;

  @Output() transactionSaved = new EventEmitter<void>();

  categories: Category[] = [];
  searchQuery: string | null = null;

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    private authService: AuthService,
    private transactionService: TransactionService,
    private notificationService: NotificationService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      description: ['', Validators.required],
      value: [null, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      categoryId: [null],
      isRecurring: [false],
      installments: [null],
    });
    this.categories = this.categoryService.getCategories();
    this.searchQuery = this.route.snapshot.queryParamMap.get('q');
    this.loadAndFilterTransactions();
    if (this.autoOpen) {
      this.openModal();
    }
  }

  clearSearch(): void {
    this.searchQuery = null;
    this.router.navigate(['/dashboard/transactions']);
    this.loadAndFilterTransactions();
  }

  get categoriesForSelectedType(): Category[] {
    const type = this.transactionForm?.get('type')?.value;
    return this.categories.filter((c) => c.type === type);
  }

  getCategory(categoryId: string | null | undefined): Category | null {
    if (!categoryId) return null;
    return this.categories.find((c) => c.id === categoryId) ?? null;
  }

  loadAndFilterTransactions(): void {
    const today = new Date();
    const allProjected = this.financeService.generateEffectiveTransactions();
    this.allTransactions = allProjected.filter((t) => {
      const { year, month } = getDatePart(t.date);
      return (
        year < today.getFullYear() ||
        (year === today.getFullYear() && month <= today.getMonth())
      );
    });
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      this.allTransactions = this.allTransactions.filter((t) =>
        t.description.toLowerCase().includes(q)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(
      this.allTransactions.length / this.itemsPerPage
    );
    if (this.currentPage > this.totalPages && this.totalPages > 0)
      this.currentPage = this.totalPages;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTransactions = this.allTransactions.slice(
      startIndex,
      endIndex
    );
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  toggleBalanceVisibility(): void {
    this.isBalanceVisible = !this.isBalanceVisible;
  }

  openModal(transaction?: Transaction): void {
    const ruleIdFromService = this.transactionService.getRuleToEdit();
    const ruleIdToEdit = transaction?.sourceRuleId || ruleIdFromService;
    if (ruleIdToEdit) {
      this.editingRuleId = ruleIdToEdit;
      const ruleToEdit = this.transactionService
        .getRecurrenceRules()
        .find((r) => r.id === this.editingRuleId);
      if (ruleToEdit) {
        this.transactionForm.setValue({
          type: ruleToEdit.type,
          description: ruleToEdit.description,
          value: ruleToEdit.value,
          date: ruleToEdit.startDate,
          categoryId: ruleToEdit.categoryId ?? null,
          isRecurring: true,
          installments: ruleToEdit.installments || null,
        });
      }
    } else {
      this.editingRuleId = null;
      this.transactionForm.reset({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        categoryId: null,
        isRecurring: false,
        installments: null,
      });
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingRuleId = null;
    this.transactionService.clearEdit();
    // No modo embutido (autoOpen), cancelar deve fechar o popup pai também,
    // em vez de deixar a lista completa de transações visível por baixo.
    if (this.autoOpen) {
      this.transactionSaved.emit();
    }
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.notificationService.show(
        'Por favor, preencha os campos corretamente.',
        'error'
      );
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const formValue = this.transactionForm.value;
    if (formValue.isRecurring) {
      if (this.editingRuleId) {
        const updatedRule: RecurrenceRule = {
          id: this.editingRuleId,
          userId: currentUser.id,
          description: formValue.description,
          value: formValue.value,
          type: formValue.type,
          startDate: formValue.date,
          dayOfMonth: new Date(formValue.date + 'T00:00:00').getDate(),
          installments: formValue.installments || null,
          isActive: true,
          categoryId: formValue.categoryId || null,
        };
        this.transactionService.updateRecurrenceRule(updatedRule);
        this.notificationService.show(
          'Regra atualizada com sucesso!',
          'success'
        );
      } else {
        const newRule: RecurrenceRule = {
          id: `rule_${new Date().getTime()}`,
          userId: currentUser.id,
          description: formValue.description,
          value: formValue.value,
          type: formValue.type,
          startDate: formValue.date,
          dayOfMonth: new Date(formValue.date + 'T00:00:00').getDate(),
          installments: formValue.installments || null,
          isActive: true,
          categoryId: formValue.categoryId || null,
        };
        this.transactionService.addRecurrenceRule(newRule);
        this.notificationService.show(
          'Regra recorrente criada com sucesso!',
          'success'
        );
      }
    } else {
      const newTransaction: Transaction = {
        id: `trans_${new Date().getTime()}`,
        userId: currentUser.id,
        description: formValue.description,
        value: formValue.value,
        type: formValue.type,
        date: new Date(formValue.date).toISOString(),
        isRecurring: false,
        categoryId: formValue.categoryId || null,
      };
      this.transactionService.addTransaction(newTransaction);
      this.notificationService.show(
        'Transação adicionada com sucesso!',
        'success'
      );
    }
    this.closeModal();
    this.loadAndFilterTransactions();
    this.transactionSaved.emit();
  }

  onDelete(ruleId: string): void {
    if (
      confirm(
        'Você tem certeza que deseja excluir esta regra e todas as suas transações futuras?'
      )
    ) {
      this.transactionService.deleteRecurrenceRule(ruleId);
      this.loadAndFilterTransactions();
      this.transactionSaved.emit();
      this.notificationService.show(
        'Regra de recorrência excluída com sucesso!',
        'success'
      );
    }
  }
}
