// ARQUIVO: src/app/utils/date.util.ts
// As datas das transações são sempre armazenadas como meia-noite UTC representando
// um dia de calendário (ex: "2026-08-06T00:00:00.000Z" = dia 06/08/2026).
// Ler essas datas com métodos locais (getMonth, getDate...) desloca o dia em fusos
// negativos (ex: Brasil). Estas funções leem sempre a partir dos componentes UTC.

export function getDatePart(isoDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return { year, month: month - 1, day };
}

export function isSameOrBeforeDay(isoDate: string, reference: Date): boolean {
  const { year, month, day } = getDatePart(isoDate);
  const dateUTC = Date.UTC(year, month, day);
  const refUTC = Date.UTC(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate()
  );
  return dateUTC <= refUTC;
}
