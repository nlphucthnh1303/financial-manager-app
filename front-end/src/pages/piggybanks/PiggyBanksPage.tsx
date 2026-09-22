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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
      await api.post(`/piggy-banks/${piggy.id}/events`, { action, amount: num, notes });
      toast.success(action === 'Deposit' ? `Đã nạp ${formatCurrency(num)} vào hũ!` : `Đã rút ${formatCurrency(num)} từ hũ!`);
      onClose(); onSuccess(); setAmount(''); setNotes('');
    } catch (err: any) { toast.error(err?.message || 'Thao tác thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{piggy?.name}</DialogTitle>
          <DialogDescription className="text-xs">Hiện tích lũy: <span className="text-zinc-900 dark:text-white font-bold">{formatCurrency(piggy?.currentAmount)}</span></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 py-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setAction('Deposit'); setErrors({}); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center justify-center gap-1.5 ${action === 'Deposit' ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-xs' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Nạp tiền
            </button>
            <button
              type="button"
              onClick={() => { setAction('Withdraw'); setErrors({}); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center justify-center gap-1.5 ${action === 'Withdraw' ? 'bg-rose-600 text-white border-transparent shadow-xs' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Rút tiền
            </button>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Số tiền (VNĐ)</label>
            <MoneyInput placeholder="0" value={amount} onValueChange={setAmount} aria-invalid={!!errors.amount} autoFocus />
            <FieldError message={errors.amount} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Ghi chú</label>
            <Input placeholder="Lý do nạp/rút..." value={notes} onChange={e => setNotes(e.target.value)} aria-invalid={!!errors.notes} maxLength={500} />
            <FieldError message={errors.notes} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              {loading ? 'Đang xử lý...' : action === 'Deposit' ? 'Xác nhận Nạp' : 'Xác nhận Rút'}
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
        setAccounts(res.data || []);
        if (res.data?.length > 0) setForm(f => ({ ...f, accountId: res.data[0].id }));
      }).catch(() => { });
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
    try {
      setLoading(true);
      await api.post('/piggy-banks', { ...form, name: form.name.trim(), targetAmount: Number(form.targetAmount), currentAmount: Number(form.currentAmount) || 0, targetDate: form.targetDate || null });
      toast.success('Đã tạo hũ tiết kiệm mới!');
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Tạo hũ thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-base font-semibold">Tạo hũ tiết kiệm mới</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Tên mục tiêu *</label>
            <Input placeholder="VD: Mua Laptop, Quỹ Du lịch..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} />
            <FieldError message={errors.name} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Liên kết với Ví *</label>
            <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} className={`flex h-9 w-full rounded-md border ${errors.accountId ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-1 text-xs shadow-xs text-zinc-900 dark:text-white focus:outline-none`}>
              {accounts.length === 0 && <option value="">Chưa có ví nào</option>}
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <FieldError message={errors.accountId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Mục tiêu (VND) *</label>
              <MoneyInput placeholder="30.000.000" value={form.targetAmount} onValueChange={v => setForm(f => ({ ...f, targetAmount: v }))} aria-invalid={!!errors.targetAmount} />
              <FieldError message={errors.targetAmount} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Số tiền hiện có</label>
              <MoneyInput placeholder="0" value={form.currentAmount} onValueChange={v => setForm(f => ({ ...f, currentAmount: v }))} aria-invalid={!!errors.currentAmount} />
              <FieldError message={errors.currentAmount} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Ngày hoàn thành dự kiến</label>
            <Input type="date" value={form.targetDate} min={toDateInput(new Date(Date.now() + 86400000))} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} aria-invalid={!!errors.targetDate} />
            <FieldError message={errors.targetDate} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{loading ? 'Đang tạo...' : 'Tạo hũ tiết kiệm'}</Button>
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
      setPiggies(res.data || []);
    } catch {
      toast.error('Không thể tải danh sách hũ tiết kiệm.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadPiggies(); }, []);


  const totalTarget = piggies.reduce((s, p) => s + p.targetAmount, 0);
  const totalSaved = piggies.reduce((s, p) => s + p.currentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Hũ Tiết kiệm</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Theo dõi tiến độ tích lũy các mục tiêu tài chính</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs self-start sm:self-auto" 
          type="button"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tạo hũ mới</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Tổng mục tiêu</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(totalTarget)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Đã tích lũy</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalSaved)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">Còn cần tiết kiệm</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(Math.max(0, totalTarget - totalSaved))}</span>
          </div>
        </div>
      </div>

      {/* Piggy Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-56 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
      ) : piggies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
          <PiggyBank className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Chưa có hũ tiết kiệm nào. Bấm "Tạo hũ mới" để đặt mục tiêu đầu tiên.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {piggies.map(p => {
          const pct = Math.min(100, p.percentageCompleted || 0);
          const isComplete = pct >= 100;
          return (
            <div key={p.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-semibold text-xs">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  {isComplete ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Hoàn thành!</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">{p.percentageCompleted?.toFixed(0)}%</span>
                  )}
                </div>

                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mt-3">{p.name}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{p.accountName}</p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(p.currentAmount)}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">/ {formatCurrency(p.targetAmount)}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-700/40">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                {p.suggestedMonthlyDeposit > 0 && (
                  <div className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-2.5 text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-700/60">
                    <CalendarClock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Nạp <strong className="text-zinc-900 dark:text-white">{formatCurrency(p.suggestedMonthlyDeposit)}</strong>/tháng</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setSelected({ piggy: p, action: 'Deposit' })}
                  className="flex-1 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  Nạp tiền
                </button>
                <button 
                  type="button"
                  onClick={() => setSelected({ piggy: p, action: 'Withdraw' })}
                  disabled={p.currentAmount <= 0}
                  className="flex-1 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-750 disabled:opacity-40 disabled:cursor-not-allowed"
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
