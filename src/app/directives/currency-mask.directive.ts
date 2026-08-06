// ARQUIVO: src/app/directives/currency-mask.directive.ts

import { Directive, HostListener, ElementRef, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true,
})
export class CurrencyMaskDirective implements OnInit {
  constructor(private el: ElementRef, private ngControl: NgControl) {}

  ngOnInit(): void {
    // Quando o formulário é preenchido programaticamente (ex: editar uma regra),
    // o input não recebe o evento 'input', então formatamos o valor inicial aqui.
    const initialValue = this.ngControl.control?.value;
    if (typeof initialValue === 'number' && !isNaN(initialValue)) {
      this.el.nativeElement.value = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(initialValue);
    }
  }

  @HostListener('input', ['$event'])
  onInputChange(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let value = inputElement.value;

    // Remove tudo que não for dígito
    value = value.replace(/\D/g, '');

    // Converte para número e divide por 100 para ter as casas decimais
    const numericValue = parseFloat(value) / 100;

    // Atualiza o valor no formulário (o valor real, numérico)
    if (!isNaN(numericValue)) {
      this.ngControl.control?.setValue(numericValue, { emitEvent: false });
    } else {
      this.ngControl.control?.setValue(null, { emitEvent: false });
    }

    // Formata o valor para exibição (visual)
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(isNaN(numericValue) ? 0 : numericValue);

    // Atualiza o valor no campo de input
    inputElement.value = formattedValue;
  }
}
