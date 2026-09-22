import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { FieldError } from '@/components/ui/field-error';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { currentMonthRange, endOfDayIso, flattenCategories, startOfDayIso, toDateInput } from '@/lib/utils';
import { check, collectErrors, type FormErrors } from '@/lib/validation';

type TxType = 'Withdrawal' | 'Deposit' | 'Transfer';

interface CreateTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: TxType;
}

const labelCls = 'text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block';
const selectCls = (invalid?: boolean) =>
  `flex h-9 w-full rounded-md border ${invalid ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none disabled:opacity-50`;

const TYPE_TABS: { value: TxType; label: string; icon: React.ElementType; active: string }[] = [
  { value: 'Withdrawal', label: 'Chi tiêu', icon: ArrowDownRight, active: 'text-rose-600 dark:text-rose-400' },
  { value: 'Deposit', label: 'Thu nhập', icon: ArrowUpRight, active: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'Transfer', label: 'Chuyển khoản', icon: ArrowLeftRight, active: 'text-sky-600 dark:text-sky-400' },
];

export const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({ open, onClose, onSuccess, defaultType = 'Withdrawal' }) => {
  const [transactionType, setTransactionType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [walletId, setWalletId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [date, setDate] = useState(toDateInput());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Fresh form every time the dialog opens
    setTransactionType(defaultType);
    setAmount(''); setDescription(''); setCounterparty(''); setCategoryId(''); setBudgetId('');
    setDate(toDateInput()); setNotes(''); setErrors({});

    const { start, end } = currentMonthRange();
    Promise.all([
      api.get('/accounts?type=Asset&active=true').catch(() => ({ data: [] })),
      api.get('/categories').catch(() => ({ data: [] })),
      api.get(`/budgets/status?start=${startOfDayIso(start)}&end=${endOfDayIso(end)}`).catch(() => ({ data: [] })),
    ]).then(([accRes, catRes, budRes]: any[]) => {
      const accs = accRes.data || [];
      setWallets(accs);
      setCategories(catRes.data || []);
      setBudgets(budRes.data || []);
      setWalletId(accs[0]?.id || '');
      setDestinationAccountId(accs[1]?.id || '');
    });
  }, [open, defaultType]);

  const switchType = (t: TxType) => {
    setTransactionType(t);
    setCategoryId(''); setBudgetId(''); setCounterparty('');
    setErrors({});
  };

  const categoryOptions = transactionType === 'Transfer' ? [] : flattenCategories(categories, transactionType === 'Deposit' ? 'Revenue' : 'Expense');

  const validate = () => collectErrors({
    amount: check.amount(amount, 'Số tiền'),
    description: check.required(description, 'Vui lòng nhập mô tả giao dịch.') || check.maxLength(description, 255, 'Mô tả'),
    walletId: !walletId && 'Vui lòng chọn ví.',
    destinationAccountId: transactionType === 'Transfer' && (
      !destinationAccountId ? 'Vui lòng chọn ví nhận tiền.' : destinationAccountId === walletId && 'Ví nhận phải khác ví chuyển.'),
    counterparty: check.maxLength(counterparty, 100, transactionType === 'Deposit' ? 'Nguồn thu' : 'Nơi chi tiêu'),
    date: !date && 'Vui lòng chọn ngày giao dịch.',
    notes: check.maxLength(notes, 500, 'Ghi chú'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    // Keep the chosen calendar day in local time: today → now, other days → midday
    const when = date === toDateInput() ? new Date() : new Date(`${date}T12:00:00`);
    const isTransfer = transactionType === 'Transfer';
    try {
      setLoading(true);
      await api.post('/transactions', {
        transactionType,
        description: description.trim(),
        amount: Number(amount),
        currencyCode: 'VND',
        date: when.toISOString(),
        sourceAccountId: walletId,
        destinationAccountId: isTransfer ? destinationAccountId : null,
        destinationAccountName: isTransfer ? null : counterparty.trim() || null,
        categoryId: !isTransfer && categoryId ? categoryId : null,
        budgetId: transactionType === 'Withdrawal' && budgetId ? budgetId : null,
        notes: notes.trim() || null,
      });
      toast.success('Thêm giao dịch thành công!');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tạo giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  const noWallet = wallets.length === 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Tạo giao dịch mới</DialogTitle>
          <DialogDescription className="text-xs">Ghi nhận khoản thu, chi hoặc chuyển tiền giữa các ví.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-2">
          <div role="tablist" className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {TYPE_TABS.map(({ value, label, icon: Icon, active }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={transactionType === value}
                onClick={() => switchType(value)}
                className={`py-1.5 rounded-md text-xs font-medium transition flex items-center justify-center gap-1 ${transactionType === value ? `bg-white dark:bg-zinc-700 shadow-xs ${active}` : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <div>
            <label className={labelCls}>Số tiền (VNĐ) *</label>
            <MoneyInput placeholder="VD: 500.000" value={amount} onValueChange={setAmount} aria-invalid={!!errors.amount} className="tabular-nums font-bold text-base" autoFocus />
            <FieldError message={errors.amount} />
          </div>

          <div>
            <label className={labelCls}>Mô tả giao dịch *</label>
            <Input placeholder="VD: Ăn tối gia đình, Lương tháng 9..." value={description} onChange={e => setDescription(e.target.value)} aria-invalid={!!errors.description} maxLength={255} />
            <FieldError message={errors.description} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{transactionType === 'Deposit' ? 'Ví nhận tiền *' : 'Ví chi tiền *'}</label>
              <select value={walletId} onChange={e => setWalletId(e.target.value)} className={selectCls(!!errors.walletId)} disabled={noWallet}>
                {noWallet && <option value="">Chưa có ví nào</option>}
                {wallets.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              <FieldError message={errors.walletId} />
            </div>

            {transactionType === 'Transfer' ? (
              <div>
                <label className={labelCls}>Chuyển đến ví *</label>
                <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} className={selectCls(!!errors.destinationAccountId)}>
                  <option value="">-- Chọn ví nhận --</option>
                  {wallets.filter(a => a.id !== walletId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
                <FieldError message={errors.destinationAccountId} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>{transactionType === 'Deposit' ? 'Nguồn thu' : 'Nơi chi tiêu'}</label>
                <Input
                  placeholder={transactionType === 'Deposit' ? 'VD: Công ty ABC' : 'VD: Highlands, Shopee'}
                  value={counterparty}
                  onChange={e => setCounterparty(e.target.value)}
                  aria-invalid={!!errors.counterparty}
                  maxLength={100}
                />
                <FieldError message={errors.counterparty} />
              </div>
            )}
          </div>

          {transactionType !== 'Transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div className={transactionType === 'Deposit' ? 'col-span-2' : ''}>
                <label className={labelCls}>Danh mục</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectCls()}>
                  <option value="">-- Không chọn --</option>
                  {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              {transactionType === 'Withdrawal' && (
                <div>
                  <label className={labelCls}>Ngân sách</label>
                  <select value={budgetId} onChange={e => setBudgetId(e.target.value)} className={selectCls()}>
                    <option value="">-- Không tính --</option>
                    {budgets.map(b => <option key={b.budgetId} value={b.budgetId}>{b.budgetName}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày giao dịch *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} aria-invalid={!!errors.date} />
              <FieldError message={errors.date} />
            </div>
            <div>
              <label className={labelCls}>Ghi chú</label>
              <Input placeholder="Ghi chú chi tiết..." value={notes} onChange={e => setNotes(e.target.value)} aria-invalid={!!errors.notes} maxLength={500} />
              <FieldError message={errors.notes} />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading || noWallet} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              {loading ? 'Đang lưu...' : 'Tạo giao dịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
