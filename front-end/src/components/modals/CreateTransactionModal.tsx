import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { FieldError } from '@/components/ui/field-error';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight, 
  Sparkles, 
  Wallet, 
  Tags, 
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { currentMonthRange, endOfDayIso, flattenCategories, formatCurrency, startOfDayIso, toDateInput } from '@/lib/utils';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { numberToVietnameseWords, QUICK_AMOUNTS, type ParsedSmsResult } from '@/lib/vietnam-banks';
import { SIX_JARS } from '@/lib/financial-frameworks';
import { SmartSmsImportModal } from '@/components/modals/SmartSmsImportModal';

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
  { value: 'Withdrawal', label: 'Chi tiêu (-)', icon: ArrowDownRight, active: 'text-rose-600 dark:text-rose-400' },
  { value: 'Deposit', label: 'Thu nhập (+)', icon: ArrowUpRight, active: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'Transfer', label: 'Chuyển tiền ↔', icon: ArrowLeftRight, active: 'text-sky-600 dark:text-sky-400' },
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
  const [selectedJar, setSelectedJar] = useState('');
  const [date, setDate] = useState(toDateInput());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTransactionType(defaultType);
    setAmount(''); setDescription(''); setCounterparty(''); setCategoryId(''); setBudgetId(''); setSelectedJar('');
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

  const handleQuickAddAmount = (addVal: number) => {
    const current = Number(amount) || 0;
    const next = current + addVal;
    setAmount(String(next));
  };

  const handleApplySmsParsed = (res: ParsedSmsResult) => {
    setTransactionType(res.type);
    setAmount(String(res.amount));
    if (res.description) setDescription(res.description);
    if (res.counterparty) setCounterparty(res.counterparty);
    
    // Auto-match wallet by bank code if available
    if (res.bankCode && wallets.length > 0) {
      const matched = wallets.find(w => 
        w.name.toLowerCase().includes(res.bankCode!.toLowerCase()) || 
        w.metadata?.bank_name?.toLowerCase().includes(res.bankCode!.toLowerCase())
      );
      if (matched) setWalletId(matched.id);
    }
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

    const when = date === toDateInput() ? new Date() : new Date(`${date}T12:00:00`);
    const isTransfer = transactionType === 'Transfer';
    const finalNotes = selectedJar ? `[Hũ: ${selectedJar}] ${notes.trim()}`.trim() : notes.trim();

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
        notes: finalNotes || null,
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

  const numAmount = Number(amount) || 0;
  const noWallet = wallets.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-semibold">Tạo giao dịch mới</DialogTitle>
                <DialogDescription className="text-xs">Ghi nhận khoản thu, chi hoặc chuyển tiền nội bộ.</DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setShowSmsModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quét SMS Banking</span>
              </button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-1">
            {/* Transaction Type Segmented Control */}
            <div role="tablist" className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              {TYPE_TABS.map(({ value, label, icon: Icon, active }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={transactionType === value}
                  onClick={() => switchType(value)}
                  className={`py-1.5 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1 ${transactionType === value ? `bg-white dark:bg-zinc-700 shadow-xs ${active}` : 'text-zinc-600 dark:text-zinc-400'}`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Money Input & Vietnamese Words Display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls}>Số tiền (VNĐ) *</label>
                {numAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount('')}
                    className="text-[10px] text-zinc-400 hover:text-rose-500 font-medium"
                  >
                    Xóa số
                  </button>
                )}
              </div>
              <MoneyInput
                placeholder="VD: 500.000"
                value={amount}
                onValueChange={setAmount}
                aria-invalid={!!errors.amount}
                className="tabular-nums font-bold text-lg h-11 text-zinc-900 dark:text-white"
                autoFocus
              />
              <FieldError message={errors.amount} />

              {/* Realtime Vietnamese Reading */}
              {numAmount > 0 && (
                <div className="mt-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  {numberToVietnameseWords(numAmount)}
                </div>
              )}

              {/* Quick Vietnamese Denomination Buttons */}
              <div className="flex flex-wrap items-center gap-1 mt-2">
                {QUICK_AMOUNTS.slice(2, 9).map(q => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => handleQuickAddAmount(q.value)}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 transition"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Mô tả giao dịch *</label>
              <Input
                placeholder="VD: Ăn tối gia đình, Tiền điện EVN, Lương tháng 9..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                aria-invalid={!!errors.description}
                maxLength={255}
              />
              <FieldError message={errors.description} />
            </div>

            {/* Wallets & Counterparty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{transactionType === 'Deposit' ? 'Ví nhận tiền *' : 'Ví chi tiền *'}</label>
                <select value={walletId} onChange={e => setWalletId(e.target.value)} className={selectCls(!!errors.walletId)} disabled={noWallet}>
                  {noWallet && <option value="">Chưa có ví nào</option>}
                  {wallets.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance || 0)})
                    </option>
                  ))}
                </select>
                <FieldError message={errors.walletId} />
              </div>

              {transactionType === 'Transfer' ? (
                <div>
                  <label className={labelCls}>Chuyển đến ví *</label>
                  <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} className={selectCls(!!errors.destinationAccountId)}>
                    <option value="">-- Chọn ví nhận --</option>
                    {wallets.filter(a => a.id !== walletId).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.destinationAccountId} />
                </div>
              ) : (
                <div>
                  <label className={labelCls}>{transactionType === 'Deposit' ? 'Nguồn thu (Công ty / Khách)' : 'Nơi chi tiêu (Quán / Cửa hàng)'}</label>
                  <Input
                    placeholder={transactionType === 'Deposit' ? 'VD: Công ty TNHH ABC' : 'VD: Highlands, Shopee, Circle K'}
                    value={counterparty}
                    onChange={e => setCounterparty(e.target.value)}
                    aria-invalid={!!errors.counterparty}
                    maxLength={100}
                  />
                  <FieldError message={errors.counterparty} />
                </div>
              )}
            </div>

            {/* Category & 6 Jars Framework */}
            {transactionType !== 'Transfer' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Danh mục</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectCls()}>
                    <option value="">-- Chọn danh mục --</option>
                    {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Quy tắc 6 Hũ (JARS)</label>
                  <select value={selectedJar} onChange={e => setSelectedJar(e.target.value)} className={selectCls()}>
                    <option value="">-- Phân bổ tự do --</option>
                    {SIX_JARS.map(jar => (
                      <option key={jar.code} value={jar.code}>
                        {jar.icon} Hũ {jar.code} ({jar.name} - {jar.percentage}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Budget & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ngày giao dịch *</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} aria-invalid={!!errors.date} />
                <FieldError message={errors.date} />
              </div>

              {transactionType === 'Withdrawal' ? (
                <div>
                  <label className={labelCls}>Tính vào Ngân sách</label>
                  <select value={budgetId} onChange={e => setBudgetId(e.target.value)} className={selectCls()}>
                    <option value="">-- Không tính --</option>
                    {budgets.map(b => <option key={b.budgetId} value={b.budgetId}>{b.budgetName}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Ghi chú chi tiết</label>
                  <Input placeholder="Ghi chú thêm..." value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
                Hủy
              </Button>
              <Button type="submit" disabled={loading || noWallet} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
                {loading ? 'Đang lưu...' : 'Tạo giao dịch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Smart SMS Import Parser Modal */}
      <SmartSmsImportModal
        open={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        onApplyParsed={handleApplySmsParsed}
      />
    </>
  );
};
