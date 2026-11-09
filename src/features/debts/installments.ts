export const money = (value: string | number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const displayDate = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

export function dateFromInput(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function installmentPlan(value: number | string, count: number, first: string) {
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents < count || !Number.isInteger(count) || count < 2 || count > 12) throw new Error('Escolha de 2 a 12 parcelas, de pelo menos R$ 0,01 cada.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(first) || dateFromInput(displayDate(first)) !== first) throw new Error('Informe uma data válida.');
  const [year, month, day] = first.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const target = new Date(year, month - 1 + index, 1, 12);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
    return {
      numero: index + 1,
      valor: (Math.floor(cents / count) + (index < cents % count ? 1 : 0)) / 100,
      vencimento: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`,
    };
  });
}
