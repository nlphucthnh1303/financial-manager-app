import React, { useState, useEffect } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Sparkles,
  Wallet,
  Tag,
  Layers,
  Calendar,
  PiggyBank
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { FieldError } from '@/components/ui/field-error';
import { api } from '@/lib/api';
import { localDb } from '@/lib/localDb';
import { formatCurrency, currentMonthRange, startOfDayIso, endOfDayIso } from '@/lib/utils';
import { numberToVietnameseWords } from '@/lib/vietnam-banks';
import { SIX_JARS } from '@/lib/financial-frameworks';
import { toast } from 'sonner';

type TxType = 'Withdrawal' | 'Deposit' | 'Transfer';

interface CreateTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: TxType;
}

interface FormErrors {
  amount?: string;
  description?: string;
  walletId?: string;
  destinationAccountId?: string;
  counterparty?: string;
  date?: string;
}

const QUICK_AMOUNTS = [
  { label: '20k', value: 20000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 },
  { label: '5tr', value: 5000000 },
  { label: '10tr', value: 10000000 },
];

const toDateInput = (d = new Date()) => d.toISOString().split('T')[0];

const labelCls = 'text-xs font-medium text-[#171717] dark:text-[#ededed] mb-1.5 block';

const TYPE_TABS: { value: TxType; label: string; icon: React.ElementType }[] = [
  { value: 'Withdrawal', label: 'Chi tiêu (−)', icon: ArrowDownRight },
  { value: 'Deposit', label: 'Thu nhập (+)', icon: ArrowUpRight },
  { value: 'Transfer', label: 'Chuyển tiền ↔', icon: ArrowLeftRight },
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

  useEffect(() => {
    if (!open) return;
    setTransactionType(defaultType);
    setAmount(''); setDescription(''); setCounterparty(''); setCategoryId(''); setBudgetId(''); setSelectedJar('');
    setDate(toDateInput()); setNotes(''); setErrors({});

    const { start, end } = currentMonthRange();
    Promise.all([
      api.get('/accounts?type=Asset&active=true').then(async (res: any) => {
        const list = res.data || [];
        if (list.length > 0) {
          await localDb.saveAccounts(list.map((a: any) => ({
            id: a.id,
            name: a.name,
            accountType: a.accountType || 'Asset',
            currentBalance: a.currentBalance || 0,
            currencyCode: a.currencyCode || 'VND',
            active: true
          })));
        }
        return list;
      }).catch(async () => {
        return await localDb.getAccounts();
      }),
      api.get('/categories').then(async (res: any) => {
        const list = res.data || [];
        if (list.length > 0) {
          await localDb.saveCategories(list.map((c: any) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon
          })));
        }
        return list;
      }).catch(async () => {
        return await localDb.getCategories();
      }),
      api.get(`/budgets/status?start=${startOfDayIso(start)}&end=${endOfDayIso(end)}`).catch(() => ({ data: [] })),
    ]).then(([wList, cList, bRes]: any[]) => {
      const finalWallets = (wList && wList.length > 0) ? wList : [];
      setWallets(finalWallets);
      if (finalWallets.length > 0 && !walletId) {
        setWalletId(finalWallets[0].id);
      }
      setCategories(cList || []);
      setBudgets(bRes.data || []);
    });
  }, [open, defaultType]);

  const switchType = (type: TxType) => {
    setTransactionType(type);
    setErrors({});
  };

  const handleQuickAddAmount = (addVal: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + addVal));
  };

  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      errs.amount = 'Vui lòng nhập số tiền hợp lệ (> 0 đ)';
    } else if (num > 999_999_999_999) {
      errs.amount = 'Số tiền vượt quá hạn mức cho phép';
    }

    if (!description.trim()) {
      errs.description = 'Mô tả không được để trống';
    }

    if (!walletId) {
      errs.walletId = 'Vui lòng chọn ví thực hiện';
    }

    if (transactionType === 'Transfer') {
      if (!destinationAccountId) {
        errs.destinationAccountId = 'Vui lòng chọn ví nhận';
      } else if (destinationAccountId === walletId) {
        errs.destinationAccountId = 'Ví nhận phải khác ví chuyển';
      }
    }

    if (!date) {
      errs.date = 'Vui lòng chọn ngày';
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    const when = date === toDateInput() ? new Date() : new Date(`${date}T12:00:00`);
    const isTransfer = transactionType === 'Transfer';
    const finalNotes = selectedJar ? `[Hũ: ${selectedJar}] ${notes.trim()}`.trim() : notes.trim();

    const chosenWallet = wallets.find((w) => w.id === walletId);
    const chosenDestWallet = isTransfer ? wallets.find((w) => w.id === destinationAccountId) : null;
    const chosenCategory = categories.find((c) => c.id === categoryId);

    const payload = {
      transactionType,
      description: description.trim(),
      amount: Number(amount),
      currencyCode: 'VND',
      date: when.toISOString(),
      sourceAccountId: walletId,
      sourceAccountName: chosenWallet?.name || 'Ví tiền mặt',
      destinationAccountId: isTransfer ? destinationAccountId : null,
      destinationAccountName: isTransfer ? chosenDestWallet?.name : counterparty.trim() || null,
      categoryId: !isTransfer && categoryId && categoryId !== 'none' ? categoryId : null,
      categoryName: chosenCategory?.name || null,
      budgetId: transactionType === 'Withdrawal' && budgetId && budgetId !== 'none' ? budgetId : null,
      notes: finalNotes || null,
    };

    try {
      setLoading(true);
      // Try to save to server
      const res: any = await api.post('/transactions', {
        ...payload,
        destinationAccountName: isTransfer ? null : counterparty.trim() || null,
      });

      // Also record in local database as synced
      await localDb.addTransaction({
        ...payload,
        serverId: res.data?.id || null,
      });

      toast.success('Thêm giao dịch thành công!');
      onClose();
      onSuccess?.();
    } catch {
      // Offline fallback: save to Local DB directly!
      await localDb.addTransaction({
        ...payload,
        serverId: null,
      });
      toast.success('Đã lưu giao dịch ngoại tuyến vào máy! (Sẽ đồng bộ khi cắm cáp USB)');
      onClose();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const numAmount = Number(amount) || 0;
  const noWallet = wallets.length === 0;

  const categoryOptions: { id: string; label: string }[] = [];
  categories.filter(c => !c.parentId).forEach(parent => {
    categoryOptions.push({ id: parent.id, label: parent.name });
    categories.filter(c => c.parentId === parent.id).forEach(sub => {
      categoryOptions.push({ id: sub.id, label: `  ↳ ${sub.name}` });
    });
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#ffffff] dark:bg-[#0a0a0a] shadow-dropdown border-0">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold text-[#171717] dark:text-[#ededed]">Tạo giao dịch mới</DialogTitle>
              <DialogDescription className="text-xs text-[#888888]">Ghi nhận khoản thu, chi hoặc chuyển tiền nội bộ.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-1">
          {/* Transaction Type Segmented Control */}
          <div role="tablist" className="grid grid-cols-3 gap-1 p-0.5 bg-[#fafafa] dark:bg-[#111111] shadow-border rounded-md">
            {TYPE_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={transactionType === value}
                onClick={() => switchType(value)}
                className={`py-1.5 rounded text-xs font-medium transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 ${transactionType === value ? 'bg-[#ffffff] dark:bg-[#1f1f1f] text-[#171717] dark:text-[#ededed] shadow-xs font-semibold' : 'text-[#666666] dark:text-[#888888] hover:text-[#171717] dark:hover:text-[#ededed]'}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Money Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>Số tiền (VNĐ) *</label>
              {numAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-[11px] text-[#888888] hover:text-[#ff5b4f] transition-colors"
                >
                  Xóa số
                </button>
              )}
            </div>
            <MoneyInput
              placeholder="500.000…"
              value={amount}
              onValueChange={setAmount}
              aria-invalid={!!errors.amount}
              className="tabular-nums font-semibold text-lg h-10 shadow-input text-[#171717] dark:text-[#ededed]"
            />
            <FieldError message={errors.amount} />

            {/* Vietnamese Words */}
            {numAmount > 0 && (
              <div className="mt-1.5 text-[11px] font-medium text-[#10b981] px-2.5 py-1 rounded bg-[#fafafa] dark:bg-[#111111] shadow-border">
                {numberToVietnameseWords(numAmount)}
              </div>
            )}

            {/* Quick Vietnamese Denomination Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {QUICK_AMOUNTS.slice(2, 9).map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleQuickAddAmount(q.value)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded bg-[#fafafa] dark:bg-[#111111] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] text-[#171717] dark:text-[#ededed] shadow-border active:scale-95 tabular-nums whitespace-nowrap"
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
              placeholder="Ăn tối gia đình, Tiền điện EVN…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
              maxLength={255}
              className="shadow-input text-xs"
            />
            <FieldError message={errors.description} />
          </div>

          {/* Wallets & Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{transactionType === 'Deposit' ? 'Ví nhận tiền *' : 'Ví chi tiền *'}</label>
              <Select value={walletId} onValueChange={setWalletId} disabled={noWallet}>
                <SelectTrigger className={`shadow-input text-xs h-9 ${errors.walletId ? 'ring-1 ring-[#ff5b4f]' : ''}`}>
                  <SelectValue placeholder="Chọn ví..." />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="text-xs">
                      {acc.name} ({formatCurrency(acc.currentBalance || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.walletId} />
            </div>

            {transactionType === 'Transfer' ? (
              <div>
                <label className={labelCls}>Chuyển đến ví *</label>
                <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                  <SelectTrigger className={`shadow-input text-xs h-9 ${errors.destinationAccountId ? 'ring-1 ring-[#ff5b4f]' : ''}`}>
                    <SelectValue placeholder="Chọn ví nhận..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.filter(a => a.id !== walletId).map(acc => (
                      <SelectItem key={acc.id} value={acc.id} className="text-xs">
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.destinationAccountId} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>{transactionType === 'Deposit' ? 'Nguồn thu (Công ty / Khách)' : 'Nơi chi (Highlands, Circle K)'}</label>
                <Input
                  placeholder={transactionType === 'Deposit' ? 'Công ty TNHH ABC…' : 'Highlands Coffee…'}
                  value={counterparty}
                  onChange={e => setCounterparty(e.target.value)}
                  aria-invalid={!!errors.counterparty}
                  maxLength={100}
                  className="shadow-input text-xs"
                />
                <FieldError message={errors.counterparty} />
              </div>
            )}
          </div>

          {/* Category & 6 Jars Framework */}
          {transactionType !== 'Transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Danh mục</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="shadow-input text-xs h-9">
                    <SelectValue placeholder="-- Chọn danh mục --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-[#888888]">-- Chọn danh mục --</SelectItem>
                    {categoryOptions.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelCls}>Quy tắc 6 Hũ (JARS)</label>
                <Select value={selectedJar} onValueChange={setSelectedJar}>
                  <SelectTrigger className="shadow-input text-xs h-9">
                    <SelectValue placeholder="-- Phân bổ tự do --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-[#888888]">-- Phân bổ tự do --</SelectItem>
                    {SIX_JARS.map(jar => (
                      <SelectItem key={jar.code} value={jar.code} className="text-xs">
                        {jar.icon} Hũ {jar.code} ({jar.name} - {jar.percentage}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Budget & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ngày giao dịch *</label>
              <DatePicker value={date} onChange={setDate} aria-invalid={!!errors.date} className="shadow-input text-xs" />
              <FieldError message={errors.date} />
            </div>

            {transactionType === 'Withdrawal' ? (
              <div>
                <label className={labelCls}>Tính vào Ngân sách</label>
                <Select value={budgetId} onValueChange={setBudgetId}>
                  <SelectTrigger className="shadow-input text-xs h-9">
                    <SelectValue placeholder="-- Không tính --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs text-[#888888]">-- Không tính --</SelectItem>
                    {budgets.map(b => (
                      <SelectItem key={b.budgetId} value={b.budgetId} className="text-xs">
                        {b.budgetName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className={labelCls}>Ghi chú chi tiết</label>
                <Input placeholder="Ghi chú thêm…" value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} className="shadow-input text-xs" />
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 flex flex-row justify-end items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs shadow-border whitespace-nowrap min-h-[36px] px-4">
              Hủy
            </Button>
            <Button type="submit" disabled={loading || noWallet} size="sm" className="text-xs bg-[#171717] dark:bg-[#ededed] text-white dark:text-black shadow-xs hover:bg-[#333333] dark:hover:bg-[#ffffff] whitespace-nowrap min-h-[36px] px-4">
              {loading ? 'Đang lưu…' : 'Tạo giao dịch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
