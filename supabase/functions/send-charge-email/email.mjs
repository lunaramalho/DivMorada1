export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function buildChargeEmail({ house, expense, debtor, creditor, amount, from, to }) {
  const value = Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error('Valor de parcela invalido.');
  const lines = [`Olá, ${debtor}!`, `Este é um lembrete amigável da sua parcela pendente na casa ${house}.`, `Despesa: ${expense}`, `Valor da parcela: ${value}`, `Quem deve receber: ${creditor}`, 'Se você já pagou, confira o registro no DivMorada.', 'Este e-mail é automático; não responda.'];
  return {
    from, to: [to], subject: 'DivMorada — lembrete de parcela pendente',
    text: lines.join('\n\n'),
    html: `<html lang="pt-BR"><body style="font-family:Arial,sans-serif;color:#25332e;line-height:1.6"><h1 style="color:#168f78">DivMorada</h1>${lines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}</body></html>`,
  };
}
