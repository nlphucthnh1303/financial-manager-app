import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, toDateInput } from '@/lib/utils';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { FieldError } from '@/components/ui/field-error';
import { 
  PiggyBank, 
  Plus, 
  Target, 
  TrendingUp, 
  CalendarClock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import { localDb } from '@/lib/localDb';

type PiggyAction = 'Deposit' | 'Withdraw';

const PiggyEventModal: React.FC<{ piggy: any; initialAction: PiggyAction; open: boolean; onClose: () => void; onSuccess: () => void }> = ({ piggy, initialAction, open, onClose, onSuccess }) => {
  const [action, setAction] = useState<PiggyAction>(initialAction);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    const found = collectErrors({
      amount: check.amount(amount, 'Số tiền') || (action === 'Withdraw' && num > piggy.currentAmount && `Chỉ có thể rút tối đa ${formatCurrency(piggy.currentAmount)}.`),
      notes: check.maxLength(notes, 500, 'Ghi chú'),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      setLoading(true);
      try {
        await api.post(`/piggy-banks/${piggy.id}/events`, { action, amount: num, notes });
      } catch {
        await localDb.updatePiggyAmount(piggy.id, action === 'Deposit' ? num : -num);
      }
      toast.success(action === 'Deposit' ? `Đã nạp ${formatCurrency(num)} vào hũ!` : `Đã rút ${formatCurrency(num)} từ hũ!`);
      onClose(); onSuccess(); setAmount(''); setNotes('');
    } catch (err: any) { toast.error(err?.message || 'Thao tác thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">{piggy?.name}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">
            Hiện tích lũy: <span className="text-[#171717] dark:text-[#ededed] font-semibold tabular-nums">{formatCurrency(piggy?.currentAmount)}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
            <button
              type="button"
              onClick={() => { setAction('Deposit'); setErrors({}); }}
              className={`h-9 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${action === 'Deposit' ? 'bg-[#171717] dark:bg-[#ededed] text-[#ffffff] dark:text-[#000000] shadow-xs' : 'text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed]'}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Nạp tiền vào hũ
            </button>
            <button
              type="button"
              onClick={() => { setAction('Withdraw'); setErrors({}); }}
              className={`h-9 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${action === 'Withdraw' ? 'bg-rose-600 text-white shadow-xs' : 'text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed]'}`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Rút tiền ra
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Số tiền (VNĐ) *</label>
            <MoneyInput placeholder="0" value={amount} onValueChange={setAmount} aria-invalid={!!errors.amount} className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            <FieldError message={errors.amount} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Ghi chú</label>
            <Input placeholder="Lý do nạp/rút…" value={notes} onChange={e => setNotes(e.target.value)} aria-invalid={!!errors.notes} maxLength={500} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            <FieldError message={errors.notes} />
          </div>
          <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg shadow-sm cursor-pointer ${action === 'Deposit' ? 'bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000]' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
            >
              {loading ? 'Đang xử lý…' : action === 'Deposit' ? 'Xác nhận Nạp' : 'Xác nhận Rút'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddPiggyModal: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({ open, onClose, onSuccess }) => {
  const empty = { name: '', accountId: '', targetAmount: '', currentAmount: '', targetDate: '', notes: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setErrors({});
      api.get('/accounts?type=Asset&active=true').then((res: any) => {
        const list = res.data || [];
        setAccounts(list);
        if (list.length > 0) setForm(f => ({ ...f, accountId: list[0].id }));
      }).catch(async () => {
        const offlineAccs = await localDb.getAccounts();
        setAccounts(offlineAccs);
        if (offlineAccs.length > 0) setForm(f => ({ ...f, accountId: offlineAccs[0].id }));
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = collectErrors({
      name: check.required(form.name, 'Vui lòng nhập tên mục tiêu.') || check.length(form.name, 2, 100, 'Tên mục tiêu'),
      accountId: !form.accountId && 'Vui lòng chọn ví liên kết.',
      targetAmount: check.amount(form.targetAmount, 'Số tiền mục tiêu'),
      currentAmount: check.amount(form.currentAmount, 'Số tiền hiện có', { allowZero: true })
        || (Number(form.currentAmount) > Number(form.targetAmount) && form.targetAmount && 'Số tiền hiện có không được lớn hơn mục tiêu.'),
      targetDate: form.targetDate && form.targetDate <= toDateInput() && 'Ngày hoàn thành phải ở tương lai.',
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    const payload = { ...form, name: form.name.trim(), targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) || 0, targetDate: form.targetDate || null };
    try {
      setLoading(true);
      try {
        await api.post('/piggy-banks', payload);
      } catch {
        await localDb.addPiggyBank(payload);
      }
      toast.success('Đã tạo hũ tiết kiệm mới!');
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Tạo hũ thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Tạo hũ tiết kiệm mới</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">Đặt mục tiêu tài chính cá nhân và tích lũy từng bước.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Tên mục tiêu *</label>
            <Input placeholder="VD: Mua Laptop, Quỹ Du lịch…" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" autoFocus />
            <FieldError message={errors.name} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Liên kết với Ví *</label>
            <Select value={form.accountId} onValueChange={v => setForm(f => ({ ...f, accountId: v }))}>
              <SelectTrigger className={`h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626] ${errors.accountId ? 'ring-1 ring-rose-500' : ''}`}>
                <SelectValue placeholder="Chọn ví liên kết…" />
              </SelectTrigger>
              <SelectContent>
                {accounts.length === 0 && <SelectItem value="none" disabled className="text-xs sm:text-sm">Chưa có ví nào</SelectItem>}
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-xs sm:text-sm">
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.accountId} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Mục tiêu (VND) *</label>
              <MoneyInput placeholder="30.000.000" value={form.targetAmount} onValueChange={v => setForm(f => ({ ...f, targetAmount: v }))} aria-invalid={!!errors.targetAmount} className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.targetAmount} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Số tiền hiện có</label>
              <MoneyInput placeholder="0" value={form.currentAmount} onValueChange={v => setForm(f => ({ ...f, currentAmount: v }))} aria-invalid={!!errors.currentAmount} className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.currentAmount} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Ngày hoàn thành dự kiến</label>
            <DatePicker value={form.targetDate} min={toDateInput(new Date(Date.now() + 86400000))} onChange={v => setForm(f => ({ ...f, targetDate: v }))} aria-invalid={!!errors.targetDate} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            <FieldError message={errors.targetDate} />
          </div>
          <DialogFooter className="pt-4 mt-2 border-t border-[#f0f0f0] dark:border-[#1f1f1f] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-transparent hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#666666] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ededed] shadow-xs cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-5 sm:px-6 text-xs sm:text-sm font-medium rounded-lg bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] shadow-sm cursor-pointer"
            >
              {loading ? 'Đang tạo…' : 'Tạo hũ tiết kiệm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PiggyBanksPage: React.FC = () => {
  const [piggies, setPiggies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<{ piggy: any; action: PiggyAction } | null>(null);

  const loadPiggies = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/piggy-banks');
      const list = res.data || [];
      setPiggies(list);
    } catch {
      const offlineList = await localDb.getPiggyBanks();
      setPiggies(offlineList);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPiggies(); }, []);

  const totalTarget = piggies.reduce((s, p) => s + p.targetAmount, 0);
  const totalSaved = piggies.reduce((s, p) => s + p.currentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Hũ Tiết kiệm</h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">Theo dõi tiến độ tích lũy các mục tiêu tài chính</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150 self-start sm:self-auto" 
          type="button"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tạo hũ mới</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-[#fafafa] dark:bg-[#161616] shadow-border text-[#0070f3] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#888888] font-medium block">Tổng mục tiêu</span>
            <span className="text-2xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums tracking-tight">{formatCurrency(totalTarget)}</span>
          </div>
        </div>

        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-[#fafafa] dark:bg-[#161616] shadow-border text-[#10b981] flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#888888] font-medium block">Đã tích lũy</span>
            <span className="text-2xl font-semibold text-[#10b981] tabular-nums tracking-tight">{formatCurrency(totalSaved)}</span>
          </div>
        </div>

        <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-[#fafafa] dark:bg-[#161616] shadow-border text-amber-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-[#888888] font-medium block">Còn cần tiết kiệm</span>
            <span className="text-2xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums tracking-tight">{formatCurrency(Math.max(0, totalTarget - totalSaved))}</span>
          </div>
        </div>
      </div>

      {/* Piggy Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-56 rounded-lg bg-[#f5f5f5] dark:bg-[#111111]" />)}</div>
      ) : piggies.length === 0 ? (
        <div className="rounded-lg shadow-border border-dashed p-10 text-center bg-[#fafafa] dark:bg-[#0c0c0c]">
          <PiggyBank className="w-6 h-6 text-[#888888] mx-auto mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#888888]">Chưa có hũ tiết kiệm nào. Bấm "Tạo hũ mới" để đặt mục tiêu đầu tiên.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {piggies.map(p => {
          const pct = Math.min(100, p.percentageCompleted || 0);
          const isComplete = pct >= 100;
          return (
            <div key={p.id} className="rounded-lg shadow-card-hover bg-[#ffffff] dark:bg-[#0a0a0a] p-5 flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-md bg-[#fafafa] dark:bg-[#161616] shadow-border text-[#10b981] flex items-center justify-center font-semibold text-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  {isComplete ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#10b981]/10 text-[#10b981]">Hoàn thành!</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fafafa] dark:bg-[#161616] shadow-border text-[#171717] dark:text-[#ededed] tabular-nums">{p.percentageCompleted?.toFixed(0)}%</span>
                  )}
                </div>

                <h3 className="font-semibold text-xs text-[#171717] dark:text-[#ededed] mt-3">{p.name}</h3>
                <p className="text-[11px] text-[#888888] mt-0.5">{p.accountName}</p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">{formatCurrency(p.currentAmount)}</span>
                    <span className="text-[11px] text-[#888888] tabular-nums">/ {formatCurrency(p.targetAmount)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#10b981] rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                {p.suggestedMonthlyDeposit > 0 && (
                  <div className="mt-3.5 flex items-center gap-1.5 rounded-md bg-[#fafafa] dark:bg-[#111111] p-2.5 text-[11px] text-[#666666] dark:text-[#888888] shadow-border">
                    <CalendarClock className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                    <span>Nạp <strong className="text-[#171717] dark:text-[#ededed] tabular-nums">{formatCurrency(p.suggestedMonthlyDeposit)}</strong>/tháng</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setSelected({ piggy: p, action: 'Deposit' })}
                  className="flex-1 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium transition-colors"
                >
                  Nạp tiền
                </button>
                <button 
                  type="button"
                  onClick={() => setSelected({ piggy: p, action: 'Withdraw' })}
                  disabled={p.currentAmount <= 0}
                  className="flex-1 py-1.5 rounded-md shadow-border bg-transparent text-[#171717] dark:text-[#ededed] text-xs font-medium transition-colors hover:bg-[#f5f5f5] dark:hover:bg-[#111111] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Rút tiền
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <AddPiggyModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={loadPiggies} />
      {selected && (
        <PiggyEventModal
          key={`${selected.piggy.id}-${selected.action}`}
          piggy={selected.piggy}
          initialAction={selected.action}
          open
          onClose={() => setSelected(null)}
          onSuccess={loadPiggies}
        />
      )}
    </div>
  );
};
