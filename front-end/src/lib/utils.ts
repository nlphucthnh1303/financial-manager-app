export { cn } from "cn";

export function formatCurrency(amount: number, currency: string = "VND"): string {
  if (isNaN(amount)) amount = 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency === 'VND' ? 'VND' : currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let val = row[header] ?? '';
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. `toISOString()` converts to UTC and lands on the previous day in UTC+7. */
export function toDateInput(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

/** Start / end of a local YYYY-MM-DD day as an ISO timestamp for API filters. */
export const startOfDayIso = (date: string) => new Date(`${date}T00:00:00`).toISOString();
export const endOfDayIso = (date: string) => new Date(`${date}T23:59:59.999`).toISOString();

/** The user's own wallet in a transaction: deposits land in the destination leg, withdrawals/transfers leave from the source leg. */
export function walletOf(tx: any): any {
  return tx?.transactionType === 'Deposit' ? tx.destinationAccount : tx?.sourceAccount;
}

/** Counterparty of a transaction (shop for expenses, payer for income, receiving wallet for transfers). */
export function counterpartyOf(tx: any): any {
  return tx?.transactionType === 'Deposit' ? tx.sourceAccount : tx?.destinationAccount;
}

/** Category tree → flat list (children indented) optionally limited to one type. */
export function flattenCategories(tree: any[], type?: 'Expense' | 'Revenue'): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const c of tree || []) {
    if (type && c.type !== type) continue;
    out.push({ id: c.id, label: c.name });
    for (const s of c.subCategories || []) out.push({ id: s.id, label: `   ↳ ${s.name}` });
  }
  return out;
}
