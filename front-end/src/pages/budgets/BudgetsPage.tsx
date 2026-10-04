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

import { localDb } from '@/lib/localDb';

const BudgetStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Overspent') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ff5b4f]/10 text-[#ff5b4f]">
      <AlertTriangle className="w-2.5 h-2.5" /> Vượt ngân sách
    </span>
  );
  if (status === 'Warning') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
      <AlertTriangle className="w-2.5 h-2.5" /> Sắp chạm ngưỡng
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#10b981]/10 text-[#10b981]">
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
      const payload = { ...form, name: form.name.trim(), limitAmount: Number(form.limitAmount) };
      try {
        await api.post('/budgets', payload);
      } catch {
        await localDb.addBudget({
          name: payload.name,
          amount: payload.limitAmount,
          period: (payload.period as any) || 'Monthly'
        });
      }
      toast.success('Đã tạo ngân sách mới!');
      onClose(); onSuccess();
    } catch (err: any) { 
      toast.error(err?.message || 'Tạo ngân sách thất bại.'); 
    }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Tạo ngân sách mới</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">Thiết lập hạn mức chi tiêu theo chu kỳ mong muốn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Tên ngân sách *</label>
            <Input placeholder="VD: Ăn uống tháng 9, Mua sắm quần áo…" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            <FieldError message={errors.name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Hạn mức (VND) *</label>
              <MoneyInput placeholder="5.000.000" value={form.limitAmount} onValueChange={v => setForm(f => ({ ...f, limitAmount: v }))} aria-invalid={!!errors.limitAmount} className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.limitAmount} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Chu kỳ</label>
              <Select value={form.period} onValueChange={v => setForm(f => ({ ...f, period: v }))}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Chọn chu kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly" className="text-xs sm:text-sm">Hàng tháng</SelectItem>
                  <SelectItem value="Weekly" className="text-xs sm:text-sm">Hàng tuần</SelectItem>
                  <SelectItem value="Yearly" className="text-xs sm:text-sm">Hàng năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Từ ngày</label>
              <DatePicker value={form.start} onChange={v => setForm(f => ({ ...f, start: v }))} aria-invalid={!!errors.start} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.start} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Đến ngày</label>
              <DatePicker value={form.end} min={form.start || undefined} onChange={v => setForm(f => ({ ...f, end: v }))} aria-invalid={!!errors.end} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.end} />
            </div>
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
              {loading ? 'Đang tạo…' : 'Tạo ngân sách'}
            </Button>
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
      const offlineBudgets = await localDb.getBudgetStatuses(start, end);
      setBudgets(offlineBudgets);
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
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Ngân sách Chi tiêu</h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">Hạn mức chi tiêu tháng {now.getMonth() + 1}/{now.getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBudgets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-border-interactive bg-[#ffffff] dark:bg-[#0a0a0a] text-xs font-medium text-[#171717] dark:text-[#ededed]"
            type="button"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#888888]" />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150"
            type="button"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm ngân sách</span>
          </button>
        </div>
      </div>

      {/* Overall Summary Card */}
      <div className="rounded-lg shadow-card bg-[#ffffff] dark:bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-semibold uppercase text-[#888888]">TỔNG NGÂN SÁCH ĐÃ SỬ DỤNG</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-semibold text-[#171717] dark:text-[#ededed] tabular-nums tracking-tight">{formatCurrency(totalSpent)}</span>
              <span className="text-xs text-[#666666] dark:text-[#888888] tabular-nums">/ {formatCurrency(totalLimit)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-semibold tabular-nums tracking-tight ${overallPct >= 100 ? 'text-[#ff5b4f]' : overallPct >= 80 ? 'text-amber-500' : 'text-[#10b981]'}`}>
              {overallPct.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="h-2 w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${overallPct >= 100 ? 'bg-[#ff5b4f]' : overallPct >= 80 ? 'bg-amber-500' : 'bg-[#10b981]'}`}
            style={{ width: `${overallPct}%` }}
          ></div>
        </div>
      </div>

      {/* Budget Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-lg bg-[#f5f5f5] dark:bg-[#111111]" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="rounded-lg shadow-border border-dashed p-10 text-center bg-[#fafafa] dark:bg-[#0c0c0c]">
          <PieChart className="w-6 h-6 text-[#888888] mx-auto mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#888888]">Chưa có ngân sách nào cho tháng này. Bấm "Thêm ngân sách" để đặt hạn mức chi tiêu.</p>
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
              className="rounded-lg shadow-card-hover bg-[#ffffff] dark:bg-[#0a0a0a] p-5 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">{b.budgetName}</h3>
                    <p className="text-[11px] text-[#888888] mt-0.5 tabular-nums">{formatDate(b.startDate)} - {formatDate(b.endDate)}</p>
                  </div>
                  <BudgetStatusBadge status={b.status} />
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-[11px] text-[#888888] font-medium">Đã chi / Hạn mức:</span>
                    <span className={`text-xs font-semibold tabular-nums ${isOver ? 'text-[#ff5b4f]' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-[#171717] dark:text-[#ededed]'}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-[#ff5b4f]' : isWarning ? 'bg-amber-500' : 'bg-[#10b981]'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#888888] font-medium block">Đã chi</span>
                  <span className="font-semibold text-[#171717] dark:text-[#ededed] tabular-nums">{formatCurrency(b.spentAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#888888] font-medium block">Còn lại</span>
                  <span className={`font-semibold tabular-nums ${b.remainingAmount < 0 ? 'text-[#ff5b4f]' : 'text-[#10b981]'}`}>
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
      const payload = { name, amountMin: min, amountMax: max, repeatFrequency: form.repeatFrequency, date: form.date, active: form.active };
      try {
        await api.post('/bills', payload);
      } catch {
        await localDb.addBill(payload);
      }
      toast.success('Đã thêm hóa đơn mới!');
      onClose(); onSuccess();
    } catch (err: any) { 
      toast.error(err?.message || 'Thêm hóa đơn thất bại.'); 
    }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#222222] shadow-2xl rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold text-[#171717] dark:text-[#ededed]">Thêm hóa đơn định kỳ</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-[#666666] dark:text-[#a1a1a1]">Theo dõi các khoản phải trả cố định như điện, nước, internet.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
          <div>
            <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Tên hóa đơn *</label>
            <Input placeholder="VD: Tiền điện EVN, Internet VNPT…" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-invalid={!!errors.name} maxLength={100} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
            <FieldError message={errors.name} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Số tiền tối thiểu *</label>
              <MoneyInput placeholder="1.000.000" value={form.amountMin} onValueChange={v => setForm(f => ({ ...f, amountMin: v }))} aria-invalid={!!errors.amountMin} className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.amountMin} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Số tiền tối đa</label>
              <MoneyInput placeholder="Bằng tối thiểu" value={form.amountMax} onValueChange={v => setForm(f => ({ ...f, amountMax: v }))} aria-invalid={!!errors.amountMax} className="h-10 text-xs sm:text-sm font-semibold rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.amountMax} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Chu kỳ lặp *</label>
              <Select value={form.repeatFrequency} onValueChange={v => setForm(f => ({ ...f, repeatFrequency: v }))}>
                <SelectTrigger className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Chọn chu kỳ lặp" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs sm:text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#444444] dark:text-[#a1a1a1] mb-1.5 block">Ngày đến hạn *</label>
              <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} aria-invalid={!!errors.date} className="h-10 text-xs sm:text-sm rounded-lg bg-[#fafafa] dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#262626]" />
              <FieldError message={errors.date} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-xs text-[#171717] dark:text-[#ededed] cursor-pointer font-medium pt-1">
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded border-[#e5e5e5] dark:border-[#262626] text-black focus:ring-0 cursor-pointer" />
            Đang theo dõi (kích hoạt)
          </label>
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
              {loading ? 'Đang lưu…' : 'Thêm hóa đơn'}
            </Button>
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
      const offlineBills = await localDb.getBills();
      setBills(offlineBills);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadBills(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171717] dark:text-[#ededed]">Hóa đơn & Định kỳ</h1>
          <p className="text-xs text-[#666666] dark:text-[#888888] mt-1">Theo dõi các khoản thanh toán cố định định kỳ</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#171717] hover:bg-[#333333] dark:bg-[#ededed] dark:hover:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] text-xs font-medium shadow-sm transition-colors duration-150"
          type="button"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Thêm hóa đơn</span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-[#f5f5f5] dark:bg-[#111111]" />)
        ) : bills.length === 0 ? (
          <div className="rounded-lg shadow-border border-dashed p-10 text-center bg-[#fafafa] dark:bg-[#0c0c0c]">
            <Receipt className="w-6 h-6 text-[#888888] mx-auto mb-2" />
            <p className="text-xs text-[#666666] dark:text-[#888888]">Chưa có hóa đơn nào. Bấm "Thêm hóa đơn" để bắt đầu theo dõi.</p>
          </div>
        ) : bills.map(b => (
          <div key={b.id} className="rounded-lg shadow-card-hover bg-[#ffffff] dark:bg-[#0a0a0a] p-4 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#fafafa] dark:bg-[#161616] shadow-border text-[#0070f3] flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-[#171717] dark:text-[#ededed]">{b.name}</h3>
                <p className="text-[11px] text-[#888888] mt-0.5 tabular-nums">{FREQUENCY_LABELS[b.repeatFrequency] || b.repeatFrequency} · Đến hạn: {formatDate(b.nextDueDate)}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-semibold text-xs text-[#171717] dark:text-[#ededed] tabular-nums block">
                {formatCurrency(b.amountMin)} {b.amountMin !== b.amountMax ? `- ${formatCurrency(b.amountMax)}` : ''}
              </span>
              {b.isPaidThisPeriod ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#10b981] font-medium mt-0.5">
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
