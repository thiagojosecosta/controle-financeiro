// ARQUIVO: src/app/components/date-picker/date-picker.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getDatePart } from '../../utils/date.util';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.html',
  styleUrls: ['./date-picker.css'],
})
export class DatePickerComponent implements OnChanges {
  @Input() value: string | null = null; // 'YYYY-MM-DD'
  @Input() placeholder = 'Selecionar data';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  viewYear = new Date().getFullYear();
  viewMonth = new Date().getMonth(); // 0-based

  weekdayLabels = WEEKDAY_LABELS;

  constructor(private elRef: ElementRef) {}

  ngOnChanges(): void {
    this.syncViewToValue();
  }

  private syncViewToValue(): void {
    if (this.value) {
      const { year, month } = getDatePart(this.value);
      this.viewYear = year;
      this.viewMonth = month;
    } else {
      const today = new Date();
      this.viewYear = today.getFullYear();
      this.viewMonth = today.getMonth();
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.syncViewToValue();
    }
  }

  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else {
      this.viewMonth--;
    }
  }

  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else {
      this.viewMonth++;
    }
  }

  selectDay(day: number | null): void {
    if (day === null) return;
    const iso = `${this.viewYear}-${pad2(this.viewMonth + 1)}-${pad2(day)}`;
    this.value = iso;
    this.valueChange.emit(iso);
    this.isOpen = false;
  }

  isSelected(day: number | null): boolean {
    if (day === null || !this.value) return false;
    const { year, month, day: d } = getDatePart(this.value);
    return year === this.viewYear && month === this.viewMonth && d === day;
  }

  isToday(day: number | null): boolean {
    if (day === null) return false;
    const today = new Date();
    return (
      this.viewYear === today.getFullYear() &&
      this.viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  }

  get monthLabel(): string {
    return `${MONTH_LABELS[this.viewMonth]} de ${this.viewYear}`;
  }

  get calendarCells(): (number | null)[] {
    const firstDayOfWeek = new Date(this.viewYear, this.viewMonth, 1).getDay();
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  get displayLabel(): string {
    if (!this.value) return this.placeholder;
    const { year, month, day } = getDatePart(this.value);
    return `${pad2(day)}/${pad2(month + 1)}/${year}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
