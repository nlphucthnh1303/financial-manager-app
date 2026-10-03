import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { currentMonthRange, formatCurrency, formatDate, toDateInput } from '@/lib/utils';
import { check, collectErrors, type FormErrors } from '@/lib/validation';
import { FieldError } from '@/components/ui/field-error';
import {
  Plus,
  PieChart,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BudgetStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Overspent') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
      <AlertTriangle className="w-2.5 h-2.5" /> Vượt ngân sách
    </span>
  );
  if (status === 'Warning') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      <AlertTriangle className="w-2.5 h-2.5" /> Sắp chạm ngưỡng
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      <CheckCircle2 className="w-2.5 h-2.5" /> Trong hạn mức
    </span>
  );
};

const AddBudgetModal: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({ open, onClose, onSuccess }) => {
  const month = currentMonthRange();
  const empty = { name: '', limitAmount: '', period: 'Monthly', start: month.start, end: month.end };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) { setForm(empty); setErrors({}); } }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = collectErrors({
      name: check.required(form.name, 'Vui lòng nhập tên ngân sách.') || check.length(form.name, 2, 100, 'Tên ngân sách'),
      limitAmount: check.amount(form.limitAmount, 'Hạn mức'),
      start: !form.start && 'Vui lòng chọn ngày bắt đầu.',
      end: !form.end ? 'Vui lòng chọn ngày kết thúc.' : check.dateOrder(form.start, form.end),
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      setLoading(true);
      await api.post('/budgets', { ...form, name: form.name.trim(), limitAmount: Number(form.limitAmount) });
      toast.success('Đã tạo ngân sách mới!');
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Tạo ngân sách thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Tạo ngân sách mới</DialogTitle>
          <DialogDescription className="text-xs">Thiết lập hạn mức chi tiêu theo chu kỳ mong muốn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Tên ngân sách *</label>
            <Input placeholder="VD: Ăn uống tháng 9, Mua sắm quần áo..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} />
            <FieldError message={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Hạn mức (VND) *</label>
              <MoneyInput placeholder="5.000.000" value={form.limitAmount} onValueChange={v => setForm(f => ({ ...f, limitAmount: v }))} aria-invalid={!!errors.limitAmount} />
              <FieldError message={errors.limitAmount} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Chu kỳ</label>
              <Select value={form.period} onValueChange={v => setForm(f => ({ ...f, period: v }))}>
                <SelectTrigger className="shadow-input text-xs h-9">
                  <SelectValue placeholder="Chọn chu kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly" className="text-xs">Hàng tháng</SelectItem>
                  <SelectItem value="Weekly" className="text-xs">Hàng tuần</SelectItem>
                  <SelectItem value="Yearly" className="text-xs">Hàng năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Từ ngày</label>
              <DatePicker value={form.start} onChange={v => setForm(f => ({ ...f, start: v }))} aria-invalid={!!errors.start} />
              <FieldError message={errors.start} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Đến ngày</label>
              <DatePicker value={form.end} min={form.start || undefined} onChange={v => setForm(f => ({ ...f, end: v }))} aria-invalid={!!errors.end} />
              <FieldError message={errors.end} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{loading ? 'Đang tạo...' : 'Tạo ngân sách'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(`/budgets/status?start=${start}&end=${end}`);
      setBudgets(res.data || []);
    } catch {
      toast.error('Không thể tải danh sách ngân sách.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBudgets(); }, []);


  const totalLimit = budgets.reduce((s, b) => s + b.limitAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);
  const overallPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Ngân sách Chi tiêu</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Hạn mức chi tiêu tháng {now.getMonth() + 1}/{now.getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBudgets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition shadow-xs"
            type="button"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs"
            type="button"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm ngân sách</span>
          </button>
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">TỔNG NGÂN SÁCH ĐÃ SỬ DỤNG</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(totalSpent)}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">/ {formatCurrency(totalLimit)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-extrabold tabular-nums ${overallPct >= 100 ? 'text-rose-600 dark:text-rose-400' : overallPct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {overallPct.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${overallPct >= 100 ? 'bg-rose-500' : overallPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${overallPct}%` }}
          ></div>
        </div>
      </div>

      {/* Budget Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
          <PieChart className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Chưa có ngân sách nào cho tháng này. Bấm "Thêm ngân sách" để đặt hạn mức chi tiêu.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {budgets.map(b => {
          const pct = Math.min(100, b.percentageSpent || 0);
          const isOver = b.status === 'Overspent';
          const isWarning = b.status === 'Warning';
          return (
            <div
              key={b.budgetId}
              className={`rounded-xl border bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between transition ${isOver ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10' : isWarning ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10' : 'border-zinc-200 dark:border-zinc-800'}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{b.budgetName}</h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                  </div>
                  <BudgetStatusBadge status={b.status} />
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-[11px] text-zinc-500 font-medium">Đã chi / Hạn mức:</span>
                    <span className={`text-xs font-bold tabular-nums ${isOver ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-700/40">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-medium block">Đã chi</span>
                  <span className="font-semibold text-zinc-900 dark:text-white tabular-nums">{formatCurrency(b.spentAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-medium block">Còn lại</span>
                  <span className={`font-semibold tabular-nums ${b.remainingAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(b.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <AddBudgetModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={loadBudgets} />
    </div>
  );
};

const FREQUENCY_LABELS: Record<string, string> = {
  Weekly: 'Hàng tuần',
  Monthly: 'Hàng tháng',
  Quarterly: 'Hàng quý',
  Yearly: 'Hàng năm',
};

const AddBillModal: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({ open, onClose, onSuccess }) => {
  const empty = { name: '', amountMin: '', amountMax: '', repeatFrequency: 'Monthly', date: toDateInput(), active: true };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) { setForm(empty); setErrors({}); } }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const min = Number(form.amountMin);
    // Leaving max empty means a fixed amount
    const max = form.amountMax ? Number(form.amountMax) : min;
    const found = collectErrors({
      name: check.required(form.name, 'Vui lòng nhập tên hóa đơn.') || check.length(form.name, 2, 100, 'Tên hóa đơn'),
      amountMin: check.amount(form.amountMin, 'Số tiền tối thiểu'),
      amountMax: (form.amountMax && check.amount(form.amountMax, 'Số tiền tối đa')) || (form.amountMin && max < min && 'Số tiền tối đa phải lớn hơn hoặc bằng số tiền tối thiểu.'),
      date: !form.date && 'Vui lòng chọn ngày đến hạn.',
    });
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      setLoading(true);
      await api.post('/bills', { name, amountMin: min, amountMax: max, repeatFrequency: form.repeatFrequency, date: form.date, active: form.active });
      toast.success('Đã thêm hóa đơn mới!');
      onClose(); onSuccess();
    } catch (err: any) { toast.error(err?.message || 'Thêm hóa đơn thất bại.'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Thêm hóa đơn định kỳ</DialogTitle>
          <DialogDescription className="text-xs">Theo dõi các khoản phải trả cố định như điện, nước, internet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Tên hóa đơn *</label>
            <Input placeholder="VD: Tiền điện EVN, Internet VNPT..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} autoFocus />
            <FieldError message={errors.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Số tiền tối thiểu *</label>
              <MoneyInput placeholder="1.000.000" value={form.amountMin} onValueChange={v => setForm(f => ({ ...f, amountMin: v }))} aria-invalid={!!errors.amountMin} />
              <FieldError message={errors.amountMin} />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Số tiền tối đa</label>
              <MoneyInput placeholder="Bằng tối thiểu" value={form.amountMax} onValueChange={v => setForm(f => ({ ...f, amountMax: v }))} aria-invalid={!!errors.amountMax} />
              <FieldError message={errors.amountMax} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Chu kỳ lặp *</label>
              <Select value={form.repeatFrequency} onValueChange={v => setForm(f => ({ ...f, repeatFrequency: v }))}>
                <SelectTrigger className="shadow-input text-xs h-9">
                  <SelectValue placeholder="Chọn chu kỳ lặp" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 block">Ngày đến hạn *</label>
              <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} aria-invalid={!!errors.date} />
              <FieldError message={errors.date} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
            Đang theo dõi (kích hoạt)
          </label>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">Hủy</Button>
            <Button type="submit" disabled={loading} size="sm" className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">{loading ? 'Đang lưu...' : 'Thêm hóa đơn'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const BillsPage: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadBills = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/bills');
      setBills(res.data || []);
    } catch {
      toast.error('Không thể tải danh sách hóa đơn.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBills(); }, []);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Hóa đơn & Định kỳ</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Theo dõi các khoản thanh toán cố định định kỳ</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs"
          type="button"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Thêm hóa đơn</span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)
        ) : bills.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center">
            <Receipt className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Chưa có hóa đơn nào. Bấm "Thêm hóa đơn" để bắt đầu theo dõi.</p>
          </div>
        ) : bills.map(b => (
          <div key={b.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-zinc-900 dark:text-white">{b.name}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{FREQUENCY_LABELS[b.repeatFrequency] || b.repeatFrequency} · Đến hạn: {formatDate(b.nextDueDate)}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-bold text-xs text-zinc-900 dark:text-white tabular-nums block">
                {formatCurrency(b.amountMin)} {b.amountMin !== b.amountMax ? `- ${formatCurrency(b.amountMax)}` : ''}
              </span>
              {b.isPaidThisPeriod ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                  Chưa thanh toán
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <AddBillModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={loadBills} />
    </div>
  );
};
